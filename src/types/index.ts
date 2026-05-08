// ─── Companion ───────────────────────────────────────────────────────────────

export interface Companion {
  id: number;
  age: number;
  gender: 'M' | 'F';
  preferences: string[];
}

// ─── Card Participants (exception-only) ──────────────────────────────────────

export interface CardParticipants {
  participantIds: number[];  // Companion.id list
  totalPeople: number;
  absentNote?: string;       // e.g. "Kids staying at hotel"
}

// ─── Travel Profile ───────────────────────────────────────────────────────────

export interface TravelProfile {
  destination: string;
  startDate: string;                   // "YYYY-MM-DD" — projectStart date
  startTime?: string;                  // "HH:MM" — projectStart time
  endDate: string;                     // "YYYY-MM-DD" — max 15 days from startDate
  endTime?: string;                    // "HH:MM" — projectEnd time
  flightDepartureTime?: string;        // "HH:MM"
  flightArrivalTime?: string;          // "HH:MM"
  totalPeople: number;
  companions: Companion[];
  travelStyle?: string;                // 프로젝트목표 (trip goal)
  notes?: string;                      // 참고사항 (free-form notes)
  language?: string;                   // 'ko' | 'en' | 'ja' ... default: 'en'
}

// ─── Card meta — shared optional fields ──────────────────────────────────────
// Captured on every activity / transit card for richer UI + later editing.

export type CardStatus = 'planned' | 'done' | 'skipped';

export interface CardMeta {
  emoji?: string;          // 이모티콘
  startDate?: string;      // "YYYY-MM-DD" (defaults to day.date)
  startTime?: string;      // "HH:MM"      (defaults to card.time)
  endDate?: string;        // "YYYY-MM-DD"
  endTime?: string;        // "HH:MM"      (start + duration)
  temperature?: number;    // °C — populated by weather pipeline
  humidity?: number;       // % — populated by weather pipeline
  weather?: string;        // short label e.g. "Sunny", "Rain"
  aiNote?: string;         // AI메모
  userNote?: string;       // 나의메모
  status?: CardStatus;     // 현황 — defaults 'planned'
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export interface FixedPointCard {
  type: 'fixed_point';
  subtype: 'trip_start' | 'trip_end';
  title: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  duration: number;
}

export interface ActivityCard extends CardMeta {
  type: 'activity';
  subtype: 'experience' | 'rest' | 'meal' | 'place';
  title: string;
  desc: string;
  location: string;
  address?: string;        // 주소 — full street address
  lat: number;
  lng: number;
  time: string;
  duration: number;
  weatherHint?: string;    // legacy seasonal hint, kept for back-compat
  participants?: CardParticipants;  // undefined = all companions (default)
}

export interface TransitCard extends CardMeta {
  type: 'transit';
  title?: string;          // optional human label e.g. "Subway to Shibuya"
  from: string;
  fromAddress?: string;    // 출발주소
  fromLat: number;
  fromLng: number;
  to: string;
  toAddress?: string;      // 도착주소
  toLat: number;
  toLng: number;
  mode: 'walk' | 'taxi' | 'bus' | 'subway' | 'car' | 'boat' | 'plane';
  time: string;
  duration: number;
  participants?: CardParticipants;  // undefined = all companions (default)
}

export interface AdCard {
  type: 'ad';
  title: string;
  desc: string;
  imageUrl?: string;
  linkUrl?: string;
}

export type ItineraryCard = FixedPointCard | ActivityCard | TransitCard | AdCard;

// ─── Daily Itinerary ─────────────────────────────────────────────────────────

export interface DailyItinerary {
  date: string;     // "YYYY-MM-DD"
  dayLabel: string; // "Day 1", "1일차" etc.
  cards: ItineraryCard[];
}

// ─── Saved Plan ──────────────────────────────────────────────────────────────

export interface TravelPlan {
  id: string;
  userId: string;
  title: string;
  profile: TravelProfile;
  itinerary: DailyItinerary[];
  version: number;
  status: 'saved' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ─── AI Responses ────────────────────────────────────────────────────────────

export interface GenerateResult {
  title: string;
  itinerary: DailyItinerary[];
}

export interface ExtractResult {
  profile: Partial<TravelProfile>;
  missingFields: string[];
  error?: 'TRIP_TOO_LONG';
}
