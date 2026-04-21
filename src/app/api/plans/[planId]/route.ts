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

  const { itinerary, changeNote } = await req.json();

  // Get current version for history
  const { data: current } = await supabase
    .from('travel_plans')
    .select('version, itinerary')
    .eq('id', params.planId)
    .eq('user_id', user.id)
    .single();

  if (!current) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const newVersion = (current.version || 1) + 1;

  // Save old version to history
  await supabase.from('plan_history').insert({
    plan_id: params.planId,
    user_id: user.id,
    version: current.version,
    itinerary: current.itinerary,
    change_note: changeNote || 'Updated',
  });

  // Update plan with new itinerary
  const { data, error } = await supabase
    .from('travel_plans')
    .update({ itinerary, version: newVersion })
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
