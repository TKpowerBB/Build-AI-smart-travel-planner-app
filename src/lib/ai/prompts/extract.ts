import { TravelProfile } from '@/types';

export function buildExtractPrompt(
  userText: string,
  existingProfile: Partial<TravelProfile> = {},
  today: string = new Date().toISOString().slice(0, 10)
): string {
  return `You are extracting travel information. MERGE the new user message into the existing profile.

Today's date: ${today}
Existing profile (already collected — KEEP these values unless the user explicitly changes them):
${JSON.stringify(existingProfile, null, 2)}

New user message: "${userText}"

Return ONLY this JSON (no markdown, no explanation). The "profile" must contain the FULL merged profile (existing + new), not just the newly extracted fields:
{
  "profile": {
    "destination": "string or null",
    "startDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "flightDepartureTime": "HH:MM or null",
    "flightArrivalTime": "HH:MM or null",
    "totalPeople": "number or null",
    "companions": [{ "id": 1, "age": 0, "gender": "M|F", "preferences": [] }],
    "travelStyle": "string or null",
    "language": "ISO 639-1 code detected from message (e.g. ko, en, ja)"
  },
  "missingFields": ["list of fields still null in the MERGED profile"],
  "error": null or "TRIP_TOO_LONG"
}

Rules:
- Resolve natural-language dates against today's date. "5월 1일" / "May 1" → if the date has already passed this year, use next year. Always output YYYY-MM-DD.
- Do NOT re-ask for fields already present in the existing profile.
- If endDate - startDate + 1 > 15 days, set error to "TRIP_TOO_LONG".
- If companions info is vague (e.g. "couple"), infer totalPeople: 2 and list companions as missing.
- Required fields to track in missingFields: destination, startDate, endDate, totalPeople, companions, travelStyle.`;
}
