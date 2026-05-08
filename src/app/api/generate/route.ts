import { NextRequest, NextResponse } from 'next/server';
import { streamGenerateItinerary } from '@/lib/ai/client';
import { buildGeneratePrompt } from '@/lib/ai/prompts/itinerary';
import { validateTravelProfile } from '@/lib/validation';
import { TravelProfile } from '@/types';

// Allow up to 60 s on Vercel Pro / Hobby for the LLM stream.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const profile: TravelProfile = await req.json();

  const error = validateTravelProfile(profile);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const prompt = buildGeneratePrompt(profile);

  try {
    // Stream directly from Gemini so Vercel sees response headers immediately
    // and the connection never idles long enough to time out.
    // Post-processing (repair, cross-check, weather) happens client-side after
    // the stream is fully consumed.
    const stream = await streamGenerateItinerary(prompt);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
