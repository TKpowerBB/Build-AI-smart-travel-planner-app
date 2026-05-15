import { TravelProfile } from '@/types';

export function buildExtractPrompt(
  userText: string,
  existingProfile: Partial<TravelProfile> = {},
  today: string = new Date().toISOString().slice(0, 10)
): string {
  return `You are extracting travel information. MERGE the new user message into the existing profile.

The user may provide ANY field at ANY time, in any order — they are NOT bound to answer the last question. They may also CORRECT a previously-filled field ("actually, not Seoul but Okinawa"). Absorb whatever information the message contains and update the profile accordingly.

Today's date: ${today}
Existing profile:
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
    "travelStyle": "string or null — the trip goal (e.g. 'relaxed foodie', 'family adventure')",
    "travelConstraints": {
      "styleTags": ["local_hidden" | "non_touristy" | "foodie" | "relaxed" | "adventure" | "family" | "luxury" | "nature" | "culture" | "shopping" | "nightlife"],
      "avoidTags": ["famous_landmarks" | "top_attractions" | "standard_tour_routes" | "crowds" | "tourist_restaurants" | "long_transits" | "tight_schedule"],
      "preferTags": ["neighborhood_markets" | "local_eateries" | "residential_walks" | "small_parks" | "community_spaces" | "independent_shops" | "ordinary_local_places" | "slow_pacing"],
      "strictness": "soft" | "medium" | "hard"
    } or null,
    "notes": "string or null — any extra free-form remarks the user mentions (allergies, must-sees, constraints)",
    "language": "ISO 639-1 code detected from message (e.g. ko, en, ja)"
  },
  "missingFields": ["list of fields still null in the MERGED profile"],
  "updatedFields": ["fields whose value changed due to this message (new or corrected). Empty if nothing changed."],
  "error": null or "TRIP_TOO_LONG"
}

Rules:
- ORDER-INDEPENDENT: extract every field the message mentions, even if unrelated to the prior question. A message like "3 people, foodies, Osaka, June 1-3" fills destination, dates, totalPeople, AND travelStyle in one shot.
- CORRECTIONS OVERRIDE: if the user contradicts an existing field ("아니 오키나와야", "not June, make it July", "change to 5 people"), REPLACE the existing value with the new one and include the field in updatedFields.
- AMBIGUOUS DATES: a bare date like "5월3일" could be start OR end.
  * If startDate is filled and endDate is missing → treat as endDate.
  * If both are filled → treat as a correction to whichever the user seems to mean; if unclear, do NOT modify either.
  * If endDate < startDate, do NOT set endDate; keep it null.
- A range expression ("6월1일에서 6월3일", "June 1-3") sets BOTH dates at once.
- Resolve natural-language dates against today's date. If a bare month/day has already passed this year, use next year. Always output YYYY-MM-DD.
- If endDate - startDate + 1 > 15 days, set error to "TRIP_TOO_LONG".
- If companions info is vague (e.g. "couple"), infer totalPeople: 2 and list companions as missing.
- Convert natural-language travelStyle/notes into travelConstraints when possible.
  * local_hidden/non_touristy examples: "찐로컬", "진짜로컬", "짱로컬", "현지인만 아는", "관광객 없는", "관광지 말고", "hidden local", "non-touristy", "locals only".
  * If the user strongly emphasizes local/non-touristy travel, set strictness to "hard", include styleTags ["local_hidden","non_touristy"], avoidTags ["famous_landmarks","top_attractions","standard_tour_routes","tourist_restaurants"], and preferTags ["neighborhood_markets","local_eateries","residential_walks","small_parks","community_spaces","independent_shops","ordinary_local_places"].
  * For ordinary preferences such as foodie, relaxed, family, nature, map them to matching styleTags/preferTags with strictness "medium" unless the user explicitly makes it strict.
  * Preserve existing travelConstraints unless the user changes travelStyle or notes.
- Do NOT re-ask for fields already present. Do NOT null out an existing field unless the user is explicitly changing it.
- Required fields to track in missingFields: destination, startDate, endDate, totalPeople, companions, travelStyle.`;
}
