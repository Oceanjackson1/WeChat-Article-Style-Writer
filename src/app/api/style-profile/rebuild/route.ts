import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { buildStyleProfile } from '@/lib/build-style-profile';
import { NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  try {
    const result = await buildStyleProfile(supabase, user.id);
    return apiSuccess({
      profile_json: result.profile_json,
      profile_summary: result.profile_summary,
      message: '风格画像已更新',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '风格分析失败';
    if (msg.includes('上传至少一篇')) return apiError('NO_ARTICLES', msg);
    if (msg.includes('获取文章') || msg.includes('保存')) return apiError('DB_ERROR', msg);
    console.error('[StyleProfile]', e);
    return apiError('AI_ERROR', '风格分析失败，请稍后重试');
  }
}
