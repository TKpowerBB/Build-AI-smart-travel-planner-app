// Supported UI languages. 'unknown' means the message is too short or
// ambiguous (place names, dates, numbers) and should NOT reset the
// current streak — this is the "tolerate 2–3 English place names inside
// a Korean conversation" case the user asked about.
export type UiLang = 'en' | 'ko' | 'ja';
type Detected = UiLang | 'unknown';

/**
 * Classify a single user message. Priority:
 *   - Any Hangul character → 'ko' (Korean takes precedence over embedded
 *     latin tokens like place names).
 *   - Any Kana character → 'ja'.
 *   - Otherwise, if there are enough latin letters, 'en'.
 *   - Otherwise 'unknown' (too short / purely numeric / punctuation).
 */
export function detectLang(text: string): Detected {
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u3040-\u30FF]/.test(text)) return 'ja';

  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (latin < 4) return 'unknown';

  // Reject single-token latin strings: they're almost always a place name,
  // email, URL, or other proper noun (e.g. "Tokyo", "tt225@naver.com").
  // Only treat latin input as English when it reads like a phrase — 2+
  // latin-bearing tokens, OR a long-enough run that it can't be just one
  // label.
  const latinTokens = text
    .trim()
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w));
  if (latinTokens.length >= 2 || latin >= 20) return 'en';

  return 'unknown';
}

export interface LangTrackerState {
  currentLang: UiLang;
  candidate: UiLang | null;
  streak: number;
}

export const INITIAL_LANG_STATE: LangTrackerState = {
  currentLang: 'en', // per product spec: pre-login conversation starts in English
  candidate: null,
  streak: 0,
};

export const LANG_SWITCH_THRESHOLD = 5;

/**
 * Apply one user message to the tracker and return the next state.
 *
 * Switch rule: the current language flips only after LANG_SWITCH_THRESHOLD
 * *consecutive* messages in a different language. 'unknown' messages
 * (short, place names, numbers) are ignored — they neither reset the
 * existing streak nor advance a new one.
 */
export function advanceLang(
  state: LangTrackerState,
  message: string
): LangTrackerState {
  const detected = detectLang(message);

  if (detected === 'unknown') return state;

  if (detected === state.currentLang) {
    // Any confirmed message in the current language clears a pending switch.
    return state.candidate ? { ...state, candidate: null, streak: 0 } : state;
  }

  // Different language
  if (state.candidate === detected) {
    const streak = state.streak + 1;
    if (streak >= LANG_SWITCH_THRESHOLD) {
      return { currentLang: detected, candidate: null, streak: 0 };
    }
    return { ...state, streak };
  }

  // A new candidate language — start counting from 1.
  return { currentLang: state.currentLang, candidate: detected, streak: 1 };
}
