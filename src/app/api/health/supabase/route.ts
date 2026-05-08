import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Supabase environment variables are missing' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    return NextResponse.json(
      {
        ok: res.ok,
        supabaseStatus: res.status,
        checkedAt: new Date().toISOString(),
      },
      {
        status: res.ok ? 200 : 502,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Supabase health check error';
    return NextResponse.json(
      {
        ok: false,
        error: message,
        checkedAt: new Date().toISOString(),
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
