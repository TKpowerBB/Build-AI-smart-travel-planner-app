'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyItinerary, TravelProfile, GenerateResult } from '@/types';
import { injectAds } from '@/utils/adInjector';
import { repairItinerary } from '@/utils/repairItinerary';
import { detectLanguageCommand } from '@/utils/detectLanguageCommand';
import { t } from '@/lib/i18n/strings';
import DayTabs from '@/components/planner/DayTabs';
import DayView from '@/components/planner/DayView';
import PlannerChat from '@/components/planner/PlannerChat';
import { useAuth } from '@/hooks/useAuth';

export default function NewPlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [itinerary, setItinerary] = useState<DailyItinerary[]>([]);
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('travelItinerary');
    const prof = sessionStorage.getItem('travelProfile');
    if (!raw || !prof) {
      router.push('/onboarding');
      return;
    }
    try {
      const result: GenerateResult = JSON.parse(raw);
      setTitle(result.title);
      setItinerary(injectAds(repairItinerary(result.itinerary)));
      setProfile(JSON.parse(prof));
    } catch {
      router.push('/onboarding');
    }
  }, [router]);

  const handleEdit = async (command: string): Promise<void | { confirmation?: string }> => {
    if (!profile) return;

    // Show the typing indicator during intent detection too — the AI
    // fallback in detectLanguageCommand can add ~500ms and we don't
    // want dead air in the chat.
    setEditLoading(true);
    try {
      // Intercept UI-language switch requests before hitting the edit API —
      // they don't change the itinerary, just the profile + UI strings.
      const targetLang = await detectLanguageCommand(command);
      if (targetLang && targetLang !== profile.language) {
        const nextProfile = { ...profile, language: targetLang };
        setProfile(nextProfile);
        sessionStorage.setItem('travelProfile', JSON.stringify(nextProfile));
        return { confirmation: t(targetLang).planner.languageChanged };
      }

      // Strip injected ad cards before sending — they aren't real itinerary data
      const clean = itinerary
        .map((day) => ({
          ...day,
          cards: day.cards.filter((c) => c.type !== 'ad'),
        }));

      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: clean, profile, command }),
      });

      if (!res.ok) {
        let msg = `Edit failed (${res.status})`;
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      let updated: DailyItinerary[];
      try {
        updated = JSON.parse(cleaned);
      } catch {
        throw new Error('AI returned invalid JSON. Please try again.');
      }
      if (!Array.isArray(updated)) {
        throw new Error('AI response was not an itinerary array.');
      }
      const repaired = repairItinerary(updated);
      setItinerary(injectAds(repaired));
      sessionStorage.setItem('travelItinerary', JSON.stringify({ title, itinerary: repaired }));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) { router.push('/login'); return; }
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, profile, itinerary }),
      });
      const data = await res.json();
      if (data.id) {
        sessionStorage.removeItem('travelItinerary');
        sessionStorage.removeItem('travelProfile');
        router.push(`/plan/${data.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!itinerary.length || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/onboarding')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{title}</p>
          <p className="text-xs text-gray-400">{profile.destination} · {itinerary.length} days</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full disabled:opacity-60 hover:bg-indigo-600 transition-colors"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>

      <DayTabs days={itinerary} selected={selectedDay} onChange={setSelectedDay} />
      <DayView day={itinerary[selectedDay]} companions={profile.companions} />
      <PlannerChat onCommand={handleEdit} loading={editLoading} lang={(profile.language as 'en' | 'ko' | 'ja') || 'en'} />
    </div>
  );
}
