'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface PlanSummary {
  id: string;
  title: string;
  profile: { destination: string; startDate: string; endDate: string; totalPeople: number };
  version: number;
  updated_at: string;
}

export default function PlansPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => { setPlans(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <div className="flex-1">
          <h1 className="font-semibold text-gray-800">My Trips</h1>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <button
          onClick={() => router.push('/onboarding')}
          className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full hover:bg-indigo-600"
        >
          + New Trip
        </button>
        <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600">
          Sign out
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🗺️</span>
            <p className="mt-4 text-gray-500 font-medium">No trips yet</p>
            <p className="text-sm text-gray-400 mt-1">Start planning your first adventure!</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-4 bg-indigo-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-600"
            >
              Plan a Trip
            </button>
          </div>
        ) : (
          plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => router.push(`/plan/${plan.id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{plan.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 {plan.profile.destination} · 👥 {plan.profile.totalPeople}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.profile.startDate} → {plan.profile.endDate}
                  </p>
                </div>
                <span className="text-xs text-gray-300 ml-2 flex-shrink-0">v{plan.version}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
