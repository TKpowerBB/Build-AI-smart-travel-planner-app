import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/client';
import { buildExtractPrompt } from '@/lib/ai/prompts/extract';
import { ExtractResult } from '@/types';

const EXTRACT_SYSTEM = `You are a travel information extractor. Output ONLY valid JSON matching the schema. No markdown.`;

export async function POST(req: NextRequest) {
  const { text }: { text: string } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const result = await generateJSON<ExtractResult>(EXTRACT_SYSTEM, buildExtractPrompt(text));
    return NextResponse.json(result);
  } catch (err) {
    console.error('[extract]', err);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
