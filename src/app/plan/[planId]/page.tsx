'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DailyItinerary, TravelProfile } from '@/types';
import { injectAds } from '@/utils/adInjector';
import { repairItinerary } from '@/utils/repairItinerary';
import DayTabs from '@/components/planner/DayTabs';
import DayView from '@/components/planner/DayView';
import PlannerChat from '@/components/planner/PlannerChat';

export default function SavedPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const [title, setTitle] = useState('');
  const [itinerary, setItinerary] = useState<DailyItinerary[]>([]);
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/plans/${planId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/plans'); return; }
        setTitle(data.title);
        setProfile(data.profile);
        setItinerary(injectAds(repairItinerary(data.itinerary)));
        setLoading(false);
      })
      .catch(() => router.push('/plans'));
  }, [planId, router]);

  const handleEdit = async (command: string) => {
    if (!profile) return;
    setEditLoading(true);
    try {
      // Strip injected ad cards before sending — they aren't real itinerary data
      const clean = itinerary.map((day) => ({
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

      // Auto-save to DB
      await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: repaired, changeNote: command }),
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/plans')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{title}</p>
          <p className="text-xs text-gray-400">{profile.destination} · {itinerary.length} days</p>
        </div>
        <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full">Saved</span>
      </div>

      <DayTabs days={itinerary} selected={selectedDay} onChange={setSelectedDay} />
      <DayView day={itinerary[selectedDay]} companions={profile.companions} />
      <PlannerChat onCommand={handleEdit} loading={editLoading} lang={(profile.language as 'en' | 'ko' | 'ja') || 'en'} />
    </div>
  );
}
