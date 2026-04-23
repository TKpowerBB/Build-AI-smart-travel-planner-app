'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestSignIn, setSuggestSignIn] = useState(false);

  const interpretError = (msg: string, currentMode: 'login' | 'signup') => {
    const m = msg.toLowerCase();
    if (currentMode === 'signup') {
      if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
        return { text: 'This email is already registered. Please sign in instead.', suggest: true };
      }
      if (m.includes('rate limit')) {
        // Supabase returns "email rate limit exceeded" when signup is attempted
        // for an existing email multiple times in a row.
        return { text: 'Too many sign-up attempts for this email. If you already have an account, sign in instead.', suggest: true };
      }
    }
    if (currentMode === 'login') {
      if (m.includes('invalid login') || m.includes('invalid credentials')) {
        return { text: 'Incorrect email or password.', suggest: false };
      }
      if (m.includes('email not confirmed')) {
        return { text: 'Please confirm your email before signing in. Check your inbox.', suggest: false };
      }
    }
    return { text: msg, suggest: false };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestSignIn(false);

    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await fn;
    if (error) {
      const { text, suggest } = interpretError(error.message, mode);
      setError(text);
      setSuggestSignIn(suggest);
    } else {
      router.push(mode === 'signup' ? '/onboarding' : '/plans');
    }
    setLoading(false);
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError('');
    setSuggestSignIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🗺️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">AI Travel Planner</h1>
          <p className="text-sm text-gray-400 mt-1">Your personalized journey awaits</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg space-y-2">
              <p>{error}</p>
              {suggestSignIn && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-block text-indigo-600 font-medium hover:underline"
                >
                  → Switch to Sign In
                </button>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-600 disabled:opacity-60 transition-colors"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => router.push('/onboarding')}
          className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 text-center"
        >
          Continue without account →
        </button>
      </div>
    </div>
  );
}
