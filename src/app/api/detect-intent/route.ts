import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/client';

export const runtime = 'nodejs';

type Intent =
  | { intent: 'language_switch'; language: 'en' | 'ko' | 'ja' }
  | { intent: 'itinerary_edit' };

const SYSTEM = `You classify a single chat command from a travel-planner user.
Return ONLY a JSON object — no prose, no markdown fences.

Two possible intents:
1. "language_switch" — the user is asking the app's UI/chat to reply in a
   different language going forward. Examples: "영어로 바꿔줘",
   "switch to Korean please", "이제부터 일본어로 답해줘", "日本語で話して",
   "can you speak English from now on?".
2. "itinerary_edit" — ANY other request, including translating content
   ("translate the menu to English"), adding an English-speaking guide,
   or anything that changes the trip plan itself.

Output shape:
  { "intent": "language_switch", "language": "en" | "ko" | "ja" }
  or
  { "intent": "itinerary_edit" }

If unsure, choose "itinerary_edit".`;

export async function POST(req: NextRequest) {
  try {
    const { command } = (await req.json()) as { command?: string };
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'command required' }, { status: 400 });
    }

    const result = await generateJSON<Intent>(SYSTEM, `User command:\n${command}`);

    // Defensive: ensure the shape matches.
    if (
      result &&
      typeof result === 'object' &&
      'intent' in result &&
      (result.intent === 'language_switch' || result.intent === 'itinerary_edit')
    ) {
      if (
        result.intent === 'language_switch' &&
        !['en', 'ko', 'ja'].includes((result as { language?: string }).language || '')
      ) {
        return NextResponse.json({ intent: 'itinerary_edit' });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ intent: 'itinerary_edit' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Fail open: on any error, treat as edit so the normal flow proceeds.
    console.warn('[detect-intent] failed:', msg);
    return NextResponse.json({ intent: 'itinerary_edit' });
  }
}
