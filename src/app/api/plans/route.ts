import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('travel_plans')
    .select('id, title, profile, version, status, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'saved')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, profile, itinerary } = await req.json();
  if (!title || !profile || !itinerary) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('travel_plans')
    .insert({ user_id: user.id, title, profile, itinerary, version: 1 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save initial history snapshot
  await supabase.from('plan_history').insert({
    plan_id: data.id,
    user_id: user.id,
    version: 1,
    itinerary,
    change_note: 'Initial save',
  });

  return NextResponse.json(data, { status: 201 });
}
