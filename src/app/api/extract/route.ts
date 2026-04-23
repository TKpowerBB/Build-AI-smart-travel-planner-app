import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/client';
import { buildExtractPrompt } from '@/lib/ai/prompts/extract';
import { ExtractResult, TravelProfile } from '@/types';

const EXTRACT_SYSTEM = `You are a travel information extractor. Output ONLY valid JSON matching the schema. No markdown.`;

const REQUIRED_FIELDS: (keyof TravelProfile)[] = [
  'destination',
  'startDate',
  'endDate',
  'totalPeople',
  'companions',
  'travelStyle',
];

function computeMissing(profile: Partial<TravelProfile>): string[] {
  return REQUIRED_FIELDS.filter((f) => {
    const v = profile[f];
    if (v === null || v === undefined) return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    text: string;
    profile?: Partial<TravelProfile>;
  };
  const { text, profile: existingProfile = {} } = body;

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const result = await generateJSON<ExtractResult>(
      EXTRACT_SYSTEM,
      buildExtractPrompt(text, existingProfile)
    );

    // Merge defensively in case the LLM omitted existing fields
    const merged: Partial<TravelProfile> = { ...existingProfile };
    if (result.profile) {
      for (const [k, v] of Object.entries(result.profile)) {
        if (v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (merged as any)[k] = v;
        }
      }
    }

    return NextResponse.json({
      profile: merged,
      missingFields: computeMissing(merged),
      error: result.error ?? null,
    });
  } catch (err) {
    console.error('[extract]', err);
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
