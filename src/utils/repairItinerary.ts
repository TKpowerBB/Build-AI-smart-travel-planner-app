import { DailyItinerary, ItineraryCard, TransitCard } from '@/types';

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
    cards: repairDayCards(day.cards),
  }));
}

function repairDayCards(cards: ItineraryCard[]): ItineraryCard[] {
  const out = cards.map((c) => ({ ...c }));
  for (let i = 0; i < out.length; i++) {
    const card = out[i];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lat = (c as any).lat;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lng = (c as any).lng;
    if (isValidCoord(lat) && isValidCoord(lng)) return { lat, lng };
  }
  return null;
}
