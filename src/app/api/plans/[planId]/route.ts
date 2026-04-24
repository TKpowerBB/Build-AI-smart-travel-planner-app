import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: { planId: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('travel_plans')
    .select('*')
    .eq('id', params.planId)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itinerary, changeNote, profile } = await req.json();

  // Get current version for history
  const { data: current } = await supabase
    .from('travel_plans')
    .select('version, itinerary')
    .eq('id', params.planId)
    .eq('user_id', user.id)
    .single();

  if (!current) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  // Profile-only updates (e.g. UI language switch) shouldn't bump version
  // or create a plan-history entry — that history is for itinerary edits.
  const isItineraryUpdate = itinerary !== undefined;
  const newVersion = isItineraryUpdate ? (current.version || 1) + 1 : current.version;

  if (isItineraryUpdate) {
    await supabase.from('plan_history').insert({
      plan_id: params.planId,
      user_id: user.id,
      version: current.version,
      itinerary: current.itinerary,
      change_note: changeNote || 'Updated',
    });
  }

  const update: Record<string, unknown> = {};
  if (isItineraryUpdate) {
    update.itinerary = itinerary;
    update.version = newVersion;
  }
  if (profile !== undefined) update.profile = profile;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('travel_plans')
    .update(update)
    .eq('id', params.planId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('travel_plans')
    .update({ status: 'archived' })
    .eq('id', params.planId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
