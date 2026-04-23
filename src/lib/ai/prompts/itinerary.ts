import { TravelProfile } from '@/types';
import { getTripDays } from '@/lib/validation';

export const SYSTEM_PROMPT = `You are an expert global travel planner AI.
Rules:
- Respond ONLY with valid JSON matching the schema — no markdown, no explanation
- Maximum 15 days per itinerary
- Use the traveler's language field for all title/desc/dayLabel text
- Include accurate lat/lng coordinates for every location
- For weatherHint: use average seasonal climate (e.g. "Sunny, avg 24°C") — NOT real-time data
- Never include ad cards — those are added separately
- participants field: omit entirely (use undefined) unless the user has explicitly restricted a card to a subset`;

export function buildGeneratePrompt(profile: TravelProfile): string {
  const days = getTripDays(profile.startDate, profile.endDate);
  const lang = profile.language || 'en';

  return `Generate a ${days}-day travel itinerary in JSON format.

Language for all text fields: ${lang}

TRAVELER PROFILE:
${JSON.stringify(profile, null, 2)}

OUTPUT SCHEMA (return exactly this JSON structure, no other text):
{
  "title": "string — catchy trip title",
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "dayLabel": "Day 1",
      "cards": [
        // Day 1 MUST start with a fixed_point trip_start card
        // Last day MUST end with a fixed_point trip_end card
        // Mix of activity and transit cards in between
        // Each transit card MUST appear between two locations
      ]
    }
  ]
}

CARD SCHEMAS:

fixed_point card:
{ "type": "fixed_point", "subtype": "trip_start"|"trip_end", "title": "", "location": "", "lat": 0.0, "lng": 0.0, "time": "HH:MM", "duration": 60 }

activity card:
{ "type": "activity", "subtype": "experience"|"rest"|"meal"|"place", "title": "", "desc": "", "location": "", "lat": 0.0, "lng": 0.0, "time": "HH:MM", "duration": 90, "weatherHint": "Sunny, avg 24°C" }

transit card:
{ "type": "transit", "from": "", "fromLat": 0.0, "fromLng": 0.0, "to": "", "toLat": 0.0, "toLng": 0.0, "mode": "taxi"|"walk"|"bus"|"subway"|"car"|"boat"|"plane", "time": "HH:MM", "duration": 30 }

RULES:
- Each day: 6-10 cards (mix of activity + transit, day 1 starts with fixed_point, last day ends with fixed_point)
- All times must be sequential within a day (no overlap)
- Use realistic travel durations between locations
- Tailor activities to companion ages, genders, and preferences
- Every transit card MUST include ALL SIX coordinate fields (from, fromLat, fromLng, to, toLat, toLng). None may be null, omitted, or set to 0 unless the location is truly on the equator/prime meridian. The fromLat/fromLng MUST match the preceding card's coordinates, and toLat/toLng MUST match the following card's coordinates.`;
}
