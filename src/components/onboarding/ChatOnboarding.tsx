'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelProfile, ExtractResult } from '@/types';
import ChatBubble from './ChatBubble';

type Message = { role: 'ai' | 'user'; text: string };

const FOLLOW_UP_QUESTIONS: Record<string, string> = {
  destination: "Where would you like to travel? 🌍",
  startDate: "When does your trip start? (e.g. 2026-06-01)",
  endDate: "When does it end? (max 15 days)",
  totalPeople: "How many people are traveling?",
  companions: "Tell me about your travel companions — their ages, gender, and what they enjoy (e.g. '32F who loves food, 35M who prefers hiking')",
  travelStyle: "What's your travel style? (e.g. relaxed, adventure, foodie, luxury)",
  flightDepartureTime: "Do you have a departure flight time? (e.g. 09:00, or skip)",
};

export default function ChatOnboarding() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm your AI travel planner 🗺️\n\nTell me about your dream trip — destination, dates, who you're traveling with, and what you enjoy. The more you share, the better your itinerary!" }
  ]);
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<Partial<TravelProfile>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'ai' | 'user', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);
    setLoading(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const result: ExtractResult = await res.json();

      if (result.error === 'TRIP_TOO_LONG') {
        addMessage('ai', "⚠️ That's more than 15 days! Please shorten your trip to a maximum of 15 days.");
        setLoading(false);
        return;
      }

      const merged = { ...profile, ...Object.fromEntries(
        Object.entries(result.profile).filter(([, v]) => v !== null && v !== undefined)
      )};
      setProfile(merged);
      setMissingFields(result.missingFields || []);

      const remaining = result.missingFields?.filter(f => f in FOLLOW_UP_QUESTIONS) || [];

      if (remaining.length > 0) {
        const nextField = remaining[0];
        addMessage('ai', FOLLOW_UP_QUESTIONS[nextField]);
      } else {
        // All info collected — start generation
        await startGeneration(merged as TravelProfile);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addMessage('ai', `❌ Error: ${msg}`);
    }
    setLoading(false);
  };

  const startGeneration = async (finalProfile: TravelProfile) => {
    setGenerating(true);
    addMessage('ai', "✨ Perfect! I have everything I need. Generating your personalized itinerary...\n\nThis may take 15-20 seconds.");

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

      sessionStorage.setItem('travelItinerary', jsonText);
      router.push('/plan/new');
    } catch (e: unknown) {
      addMessage('ai', `❌ Generation failed: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again.`);
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your trip..."
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
