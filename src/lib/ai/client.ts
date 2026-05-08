import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from './prompts/itinerary';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 사용 가능한 모델 우선순위 (위에서부터 시도)
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function cleanModelText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function extractJsonPayload(text: string): string {
  const cleaned = cleanModelText(text);
  const start = cleaned.search(/[\[{]/);
  if (start === -1) return cleaned;

  let depth = 0;
  let inString = false;
  let escaped = false;
  const opener = cleaned[start];
  const closer = opener === '{' ? '}' : ']';

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === opener) depth += 1;
    if (ch === closer) depth -= 1;
    if (depth === 0) return cleaned.slice(start, i + 1);
  }

  return cleaned.slice(start);
}

function parseModelJSON<T>(text: string): T {
  const cleaned = cleanModelText(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return JSON.parse(extractJsonPayload(cleaned)) as T;
  }
}

async function tryGenerateContent(
  prompt: string,
  systemInstruction: string,
  options: { json?: boolean } = {}
) {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          ...(options.json ? { responseMimeType: 'application/json', temperature: 0 } : {}),
        },
      });
      const text = response.text ?? '';
      const cleaned = cleanModelText(text);
      if (!cleaned) {
        throw new Error(`Model ${model} returned empty response`);
      }
      return cleaned;
    } catch (e) {
      lastError = e;
      console.warn(`[AI] Model ${model} failed, trying next...`, e);
    }
  }
  throw lastError;
}

async function tryGenerateStream(prompt: string, systemInstruction: string): Promise<ReadableStream<Uint8Array>> {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: { systemInstruction },
      });
      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const text = chunk.text ?? '';
              if (text) controller.enqueue(encoder.encode(text));
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    } catch (e) {
      lastError = e;
      console.warn(`[AI] Stream model ${model} failed, trying next...`, e);
    }
  }
  throw lastError;
}

// 일정 생성 (스트리밍)
export async function streamGenerateItinerary(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  return tryGenerateStream(userPrompt, SYSTEM_PROMPT);
}

// JSON 추출 (단발성)
export async function generateJSON<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<T> {
  const text = await tryGenerateContent(userPrompt, systemInstruction, { json: true });
  return parseModelJSON<T>(text);
}

// 일정 수정 (스트리밍)
export async function editItinerary(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const editSystem = `You are a travel itinerary editor. Output ONLY valid JSON array. No markdown, no explanation.`;
  return tryGenerateStream(userPrompt, editSystem);
}
