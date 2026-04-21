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
  startDate: string;                   // "YYYY-MM-DD"
  endDate: string;                     // "YYYY-MM-DD" — max 15 days from startDate
  flightDepartureTime?: string;        // "HH:MM"
  flightArrivalTime?: string;          // "HH:MM"
  totalPeople: number;
  companions: Companion[];
  travelStyle?: string;
  language?: string;                   // 'ko' | 'en' | 'ja' ... default: 'en'
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

export interface ActivityCard {
  type: 'activity';
  subtype: 'experience' | 'rest' | 'meal' | 'place';
  title: string;
  desc: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  duration: number;
  weatherHint?: string;
  participants?: CardParticipants;  // undefined = all companions (default)
}

export interface TransitCard {
  type: 'transit';
  from: string;
  fromLat: number;
  fromLng: number;
  to: string;
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
