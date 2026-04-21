'use client';
import { useState, useCallback } from 'react';
import { DailyItinerary, GenerateResult, TravelProfile } from '@/types';
import { injectAds } from '@/utils/adInjector';

async function consumeStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

export function useItinerary() {
  const [itinerary, setItinerary] = useState<DailyItinerary[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (profile: TravelProfile) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const text = await consumeStream(res.body!);
      const result: GenerateResult = JSON.parse(text);
      setTitle(result.title);
      setItinerary(injectAds(result.itinerary));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const edit = useCallback(async (profile: TravelProfile, command: string) => {
    setEditLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary, profile, command }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Edit failed');
      }

      const text = await consumeStream(res.body!);
      const updated: DailyItinerary[] = JSON.parse(text);
      setItinerary(injectAds(updated));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setEditLoading(false);
    }
  }, [itinerary]);

  return { itinerary, title, loading, editLoading, error, generate, edit, setItinerary, setTitle };
}
