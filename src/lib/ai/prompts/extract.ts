export function buildExtractPrompt(userText: string): string {
  return `Extract travel information from the user's message into a structured JSON object.

User message: "${userText}"

Return ONLY this JSON (no markdown, no explanation):
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
  "missingFields": ["list of null field names"],
  "error": null or "TRIP_TOO_LONG"
}

If endDate - startDate + 1 > 15 days, set error to "TRIP_TOO_LONG".
If companions info is vague (e.g. "couple"), infer: 2 people, ask for ages/gender in missingFields.`;
}
