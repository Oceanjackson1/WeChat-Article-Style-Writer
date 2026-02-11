import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { NextResponse } from 'next/server';

const BUCKET = 'user-articles';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const userId = user.id;

  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });
    if (files?.length) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
    await supabase.from('user_articles').delete().eq('user_id', userId);
    await supabase.from('user_style_profiles').delete().eq('user_id', userId);
  } catch (e) {
    console.error('[DeleteAll] error:', e);
    return apiError('DB_ERROR', '删除失败，请稍后重试');
  }

  return apiSuccess({ message: '已清空已上传文件与风格画像' });
}
