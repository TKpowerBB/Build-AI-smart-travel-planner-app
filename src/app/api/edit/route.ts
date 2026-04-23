import { NextRequest, NextResponse } from 'next/server';
import { editItinerary } from '@/lib/ai/client';
import { buildEditPrompt } from '@/lib/ai/prompts/editItinerary';
import { DailyItinerary, TravelProfile } from '@/types';

export async function POST(req: NextRequest) {
  const { itinerary, profile, command }: {
    itinerary: DailyItinerary[];
    profile: TravelProfile;
    command: string;
  } = await req.json();

  if (!itinerary || !profile || !command) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const prompt = buildEditPrompt(itinerary, profile, command);

  try {
    const stream = await editItinerary(prompt);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[edit]', err);
    const msg = err instanceof Error ? err.message : 'AI edit failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
