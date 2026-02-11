import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const { data: profile, error } = await supabase
    .from('user_style_profiles')
    .select('profile_json, profile_summary, updated_at')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[StyleProfile] get error:', error);
    return apiError('DB_ERROR', '获取风格画像失败');
  }

  return apiSuccess({
    profile_json: profile?.profile_json ?? null,
    profile_summary: profile?.profile_summary ?? null,
    updated_at: profile?.updated_at ?? null,
  });
}
