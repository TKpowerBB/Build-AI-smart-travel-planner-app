'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelProfile, ExtractResult, DailyItinerary } from '@/types';
import { repairItinerary } from '@/utils/repairItinerary';
import { advanceLang, INITIAL_LANG_STATE, LangTrackerState } from '@/utils/langTracker';
import { t } from '@/lib/i18n/strings';
import ChatBubble from './ChatBubble';

type Message = { role: 'ai' | 'user'; text: string };

export default function ChatOnboarding() {
  const router = useRouter();
  // Initial greeting is intentionally English — product decision: pre-login
  // users see English first. Language flips only after 5 consecutive
  // non-English user messages (see langTracker.ts).
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm your AI travel planner 🗺️\n\nTell me about your dream trip — destination, dates, who you're traveling with, and what you enjoy. The more you share, the better your itinerary!" }
  ]);
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<Partial<TravelProfile>>({});
  const [, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [langState, setLangState] = useState<LangTrackerState>(INITIAL_LANG_STATE);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const strings = t(langState.currentLang);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Return focus to the textarea whenever it becomes enabled again —
  // covers post-send and post-generation transitions. The textarea is
  // `disabled` during loading/generating, and a disabled element loses
  // focus on its own; we put it back as soon as it's interactive.
  useEffect(() => {
    if (!loading && !generating) {
      inputRef.current?.focus();
    }
  }, [loading, generating]);

  const addMessage = (role: 'ai' | 'user', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);
    // Update language tracker BEFORE we derive strings for follow-ups.
    // If this message pushes the streak past the threshold, the next AI
    // follow-up will already be in the new language.
    const nextLangState = advanceLang(langState, text);
    setLangState(nextLangState);
    const nextStrings = t(nextLangState.currentLang);
    setLoading(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Server error ${res.status}`);
      }

      const result = json as ExtractResult;

      if (result.error === 'TRIP_TOO_LONG') {
        addMessage('ai', nextStrings.tripTooLong);
        setLoading(false);
        return;
      }

      if (!result.profile) {
        throw new Error(nextStrings.invalidProfile);
      }

      const merged = result.profile as Partial<TravelProfile>;
      setProfile(merged);
      setMissingFields(result.missingFields || []);

      const followUpKeys = Object.keys(nextStrings.followUp);
      const remaining = (result.missingFields || []).filter((f) => followUpKeys.includes(f));

      if (remaining.length > 0) {
        const nextField = remaining[0] as keyof typeof nextStrings.followUp;
        addMessage('ai', nextStrings.followUp[nextField]);
      } else {
        // All info collected — pin the UI language into the profile so the
        // generated itinerary matches the user's conversation language.
        const finalProfile = { ...merged, language: nextLangState.currentLang } as TravelProfile;
        await startGeneration(finalProfile, nextStrings);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addMessage('ai', nextStrings.genericError(msg));
    }
    setLoading(false);
  };

  const startGeneration = async (finalProfile: TravelProfile, localStrings = strings) => {
    setGenerating(true);
    addMessage('ai', localStrings.generating);

    // Store profile for the plan page
    sessionStorage.setItem('travelProfile', JSON.stringify(finalProfile));

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProfile),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let jsonText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jsonText += decoder.decode(value, { stream: true });
      }

      // Strip markdown fences that the streaming model may emit
      const cleaned = jsonText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Validate before navigating so a parse failure surfaces as a chat error
      // instead of silently bouncing back to /onboarding
      let parsed: { title: string; itinerary: DailyItinerary[] };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('AI returned invalid itinerary JSON. Please try again.');
      }
      if (!parsed || !Array.isArray(parsed.itinerary)) {
        throw new Error('AI response missing itinerary array.');
      }
      parsed.itinerary = repairItinerary(parsed.itinerary);

      sessionStorage.setItem('travelItinerary', JSON.stringify(parsed));
      router.push('/plan/new');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      addMessage('ai', localStrings.generationFailed(msg));
      setGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">AI</div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">AI Travel Planner</p>
          <p className="text-xs text-green-500">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {(loading || generating) && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2">AI</div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={strings.inputPlaceholder}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 max-h-32"
            rows={1}
            disabled={loading || generating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || generating}
            className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
