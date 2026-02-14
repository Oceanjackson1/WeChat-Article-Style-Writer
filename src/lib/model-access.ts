import type { SupabaseClient } from '@supabase/supabase-js';

export async function getUserInviteVerified(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_model_access')
    .select('invite_verified')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01') return false;
    throw error;
  }

  return data?.invite_verified === true;
}

export async function markInviteVerified(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('user_model_access').upsert(
    {
      user_id: userId,
      invite_verified: true,
      verified_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    if (error.code === '42P01') {
      throw new Error('INVITE_TABLE_MISSING');
    }
    throw error;
  }
}
