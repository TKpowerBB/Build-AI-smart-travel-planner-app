import { ActivityCard, DailyItinerary, ItineraryCard, TransitCard } from '@/types';

/** Add `minutes` to a "HH:MM" string and return "HH:MM" (24h). Wraps within day. */
function addMinutes(time: string | undefined, minutes: number | undefined): string | undefined {
  if (!time || typeof minutes !== 'number') return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return undefined;
  const total = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + minutes) % (24 * 60);
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Default subtype emojis for activity cards when the LLM omits one. */
const ACTIVITY_EMOJI: Record<string, string> = {
  experience: '🎯', rest: '😴', meal: '🍽️', place: '📍',
};
const TRANSIT_EMOJI: Record<string, string> = {
  walk: '🚶', taxi: '🚕', bus: '🚌', subway: '🚇',
  car: '🚗', boat: '⛴️', plane: '✈️',
};

/**
 * Pipeline step 3: cross-check that each card's location belongs to the
 * trip destination. We only emit a console warning here — the LLM has
 * already been instructed to constrain locations, and we don't want to
 * silently mutate text the user will see.
 */
export function crossCheckDestination(days: DailyItinerary[], destination: string): void {
  if (!destination) return;
  const tokens = destination
    .toLowerCase()
    .split(/[\s,/]+/)
    .filter((t) => t.length > 1);
  if (tokens.length === 0) return;
  const matchesDestination = (text: string | undefined) => {
    if (!text) return true; // missing location → can't disprove
    const lower = text.toLowerCase();
    return tokens.some((t) => lower.includes(t));
  };
  for (const day of days) {
    for (const c of day.cards) {
      if (c.type === 'activity') {
        if (!matchesDestination(c.address) && !matchesDestination(c.location)) {
          console.warn(`[crossCheck] activity "${c.title}" location "${c.location}" may be outside ${destination}`);
        }
      }
    }
  }
}

/**
 * Defensively fill missing transit-card coordinates by borrowing from
 * neighbouring cards in the same day. The LLM occasionally drops one of
 * the six coordinate fields on a transit card; this keeps the itinerary
 * map/rendering usable without re-prompting.
 *
 * For each transit card:
 *   - If fromLat/fromLng missing: copy from the previous card (its lat/lng,
 *     or toLat/toLng if the previous card was also a transit).
 *   - If toLat/toLng missing: copy from the next non-ad card (its lat/lng,
 *     or fromLat/fromLng if it's a transit).
 */
export function repairItinerary(days: DailyItinerary[]): DailyItinerary[] {
  return days.map((day) => ({
    ...day,
    cards: repairDayCards(day.cards, day.date),
  }));
}

function repairDayCards(cards: ItineraryCard[], dayDate: string): ItineraryCard[] {
  const out = cards.map((c) => ({ ...c }));
  for (let i = 0; i < out.length; i++) {
    const card = out[i];

    // Default the new CardMeta fields (status, emoji, start/end times, dates).
    // We only fill blanks — never overwrite values the LLM produced.
    if (card.type === 'activity' || card.type === 'transit') {
      const m = card;
      if (!m.status) m.status = 'planned';
      if (!m.startDate) m.startDate = dayDate;
      if (!m.endDate) m.endDate = dayDate;
      if (!m.startTime && m.time) m.startTime = m.time;
      if (!m.endTime && m.time) m.endTime = addMinutes(m.time, m.duration);
      if (!m.emoji) {
        m.emoji = card.type === 'activity'
          ? ACTIVITY_EMOJI[card.subtype]
          : TRANSIT_EMOJI[card.mode];
      }
    }

    if (card.type !== 'transit') continue;
    const t = card as TransitCard;

    if (!isValidCoord(t.fromLat) || !isValidCoord(t.fromLng)) {
      const prev = findCoordNeighbour(out, i, -1, 'outgoing');
      if (prev) {
        if (!isValidCoord(t.fromLat)) t.fromLat = prev.lat;
        if (!isValidCoord(t.fromLng)) t.fromLng = prev.lng;
      }
    }

    if (!isValidCoord(t.toLat) || !isValidCoord(t.toLng)) {
      const next = findCoordNeighbour(out, i, 1, 'incoming');
      if (next) {
        if (!isValidCoord(t.toLat)) t.toLat = next.lat;
        if (!isValidCoord(t.toLng)) t.toLng = next.lng;
      }
    }
  }
  return out;
}

function isValidCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n !== 0;
}

/**
 * Walk in `direction` (-1 or +1) from `from` to find a card with usable
 * coordinates. Ad cards are skipped. For `outgoing` (prev→this transit),
 * prefer the previous card's destination; for `incoming` (this transit→
 * next), prefer the next card's origin.
 */
function findCoordNeighbour(
  cards: ItineraryCard[],
  from: number,
  direction: -1 | 1,
  kind: 'outgoing' | 'incoming'
): { lat: number; lng: number } | null {
  for (let i = from + direction; i >= 0 && i < cards.length; i += direction) {
    const c = cards[i];
    if (c.type === 'ad') continue;
    if (c.type === 'transit') {
      const t = c as TransitCard;
      // outgoing: we came FROM this transit's destination
      // incoming: we are going TO this transit's origin
      const lat = kind === 'outgoing' ? t.toLat : t.fromLat;
      const lng = kind === 'outgoing' ? t.toLng : t.fromLng;
      if (isValidCoord(lat) && isValidCoord(lng)) return { lat, lng };
      continue;
    }
    // activity or fixed_point
    if (isValidCoord(c.lat) && isValidCoord(c.lng)) return { lat: c.lat, lng: c.lng };
  }
  return null;
}
