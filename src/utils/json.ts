export function cleanModelText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export function extractJsonPayload(text: string): string {
  const cleaned = cleanModelText(text);
  const start = cleaned.search(/[\[{]/);
  if (start === -1) return cleaned;

  const opener = cleaned[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

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

export function parseModelJSON<T>(text: string): T {
  const cleaned = cleanModelText(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return JSON.parse(extractJsonPayload(cleaned)) as T;
  }
}
