import { UiLang } from './langTracker';

/**
 * Fast synchronous guess at whether a chat command is a UI-language
 * switch request. Used as a zero-latency path before falling back to
 * an AI classifier (`detectLanguageCommandAI`) for ambiguous phrasings.
 *
 * Deliberately conservative: requires both a target-language mention
 * AND an explicit switch verb, and ignores long messages. Content edits
 * like "translate the menu to English" intentionally do NOT match.
 */
export function detectLanguageCommandSync(text: string): UiLang | null {
  const raw = text.trim();
  if (!raw) return null;
  if (/^\s*translate\b/i.test(raw)) return null;
  if (raw.length > 60) return null;

  const EN_TARGET = /(english|영어|英語|英文)/i;
  const KO_TARGET = /(korean|한국어|한글|韓国語|韩语)/i;
  const JA_TARGET = /(japanese|일본어|日本語|日语)/i;

  const ACTIONS: RegExp[] = [
    /\b(change|switch|set|use)\b/i,
    /\bspeak\b/i,
    /\breply in\b|\brespond in\b|\banswer in\b|\btalk in\b|\bwrite in\b/i,
    /\bin\s+(english|korean|japanese)\b/i,
    /로\s*(바꿔|변경|해|말|대답|답변|응답|써|표시)/,
    /(바꿔|변경)\s*줘/,
    /に(変|して|で\s*(話|答|返|応))/,
    /にして/,
    /で\s*(話|返信|答え|応答)/,
  ];
  if (!ACTIONS.some((re) => re.test(raw))) return null;

  if (EN_TARGET.test(raw)) return 'en';
  if (KO_TARGET.test(raw)) return 'ko';
  if (JA_TARGET.test(raw)) return 'ja';

  return null;
}

type IntentResponse =
  | { intent: 'language_switch'; language: UiLang }
  | { intent: 'itinerary_edit' };

/**
 * Hybrid language-switch detector. Tries the fast regex path first so
 * obvious cases ("영어로 바꿔줘") stay instant; falls back to the AI
 * classifier for free-form phrasings ("이제부터 영어로 답해주세요",
 * "can you please reply in Korean from now on?"). The AI endpoint
 * fails open to 'itinerary_edit' so a classifier outage can never
 * block the normal edit flow.
 */
export async function detectLanguageCommand(text: string): Promise<UiLang | null> {
  const fast = detectLanguageCommandSync(text);
  if (fast) return fast;

  try {
    const res = await fetch('/api/detect-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: text }),
    });
    if (!res.ok) return null;
    const data: IntentResponse = await res.json();
    return data.intent === 'language_switch' ? data.language : null;
  } catch {
    return null;
  }
}
