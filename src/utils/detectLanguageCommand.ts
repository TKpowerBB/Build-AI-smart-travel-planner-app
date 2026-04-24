import { UiLang } from './langTracker';

/**
 * Detect when a user's chat command is asking to switch the UI language
 * rather than edit the itinerary. Returns the target language or null.
 *
 * Intentionally conservative — only triggers on short messages that name
 * a target language AND contain a clear switch verb. This avoids
 * misreading content edits like "translate the menu to English" or
 * "add an English-speaking guide" as UI-language requests.
 */
export function detectLanguageCommand(text: string): UiLang | null {
  const raw = text.trim();
  if (!raw) return null;

  // A content edit like "translate X to English" is not a UI switch.
  if (/^\s*translate\b/i.test(raw)) return null;

  // UI switch requests are almost always short imperatives. Anything
  // long enough to describe an itinerary change is probably a content edit.
  if (raw.length > 60) return null;

  // Target language synonyms
  const EN_TARGET = /(english|영어|英語|英文)/i;
  const KO_TARGET = /(korean|한국어|한글|韓国語|韩语)/i;
  const JA_TARGET = /(japanese|일본어|日本語|日语)/i;

  // Action phrases that indicate an explicit switch intent.
  const ACTIONS: RegExp[] = [
    /\b(change|switch|set|use)\b/i,          // "change to English"
    /\bspeak\b/i,                            // "speak Korean"
    /\breply in\b|\brespond in\b|\banswer in\b|\btalk in\b|\bwrite in\b/i,
    /\bin\s+(english|korean|japanese)\b/i,   // "in English"
    /로\s*(바꿔|변경|해|말|대답|답변|응답|써|표시)/, // 영어로 바꿔/해줘/말해줘…
    /(바꿔|변경)\s*줘/,                        // 언어 바꿔줘
    /に(変|して|で\s*(話|答|返|応))/,            // 日本語にして / に変えて / で話して
    /にして/,                                  // 日本語にして
    /で\s*(話|返信|答え|応答)/,                  // 韓国語で話して
  ];
  const hasAction = ACTIONS.some((re) => re.test(raw));
  if (!hasAction) return null;

  if (EN_TARGET.test(raw)) return 'en';
  if (KO_TARGET.test(raw)) return 'ko';
  if (JA_TARGET.test(raw)) return 'ja';

  return null;
}
