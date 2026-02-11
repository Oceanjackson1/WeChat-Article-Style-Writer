import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { generationsQuerySchema } from '@/lib/zod-schemas';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const parsed = generationsQuerySchema.safeParse({
    limit: searchParams.get('limit'),
  });
  const limit = parsed.success ? parsed.data.limit : 10;

  const { data: list, error } = await supabase
    .from('generations')
    .select('id, target_length, content_outline, key_points, title, article, article_char_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Generations] list error:', error);
    return apiError('DB_ERROR', '获取列表失败');
  }

  return apiSuccess({ generations: list ?? [] });
}
