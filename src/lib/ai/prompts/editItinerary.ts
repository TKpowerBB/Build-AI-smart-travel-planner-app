import { DailyItinerary, TravelProfile } from '@/types';

export function buildEditPrompt(
  itinerary: DailyItinerary[],
  profile: TravelProfile,
  userCommand: string
): string {
  return `You are editing an existing travel itinerary based on a user command.

USER COMMAND: "${userCommand}"

TRAVEL PROFILE (companions reference):
${JSON.stringify(profile, null, 2)}

CURRENT ITINERARY:
${JSON.stringify(itinerary, null, 2)}

RULES:
- Apply ONLY the changes requested in the command
- Do NOT change unrelated cards
- After any time/duration change, cascade-update all subsequent cards' times on the same day
- If participants change for a card: set participants field with { participantIds, totalPeople, absentNote }
- participantIds must be valid Companion ids from the profile
- Total trip days must not exceed 15
- Return ONLY the complete updated itinerary JSON array (same schema as input)
- No markdown, no explanation`;
}
