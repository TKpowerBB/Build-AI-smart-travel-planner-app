import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from './prompts/itinerary';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL = 'gemini-2.5-flash-preview-04-17';

// Returns a ReadableStream of JSON text chunks
export async function streamGenerateItinerary(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const response = await ai.models.generateContentStream({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
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
}

// Non-streaming call for extraction (fast, small payload)
export async function generateJSON<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<T> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });
  const text = response.text ?? '';
  return JSON.parse(text) as T;
}

// Edit: non-streaming (faster for targeted edits)
export async function editItinerary(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const editSystem = `You are a travel itinerary editor. Output ONLY valid JSON — the updated itinerary array. No markdown.`;
  const response = await ai.models.generateContentStream({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: editSystem,
      responseMimeType: 'application/json',
    },
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
}
