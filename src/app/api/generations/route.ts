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

  const primaryList = await supabase
    .from('generations')
    .select(
      'id, model_key, model_id, target_length, content_outline, key_points, title, article, article_char_count, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  let list = primaryList.data as
    | Array<{
        id: string;
        model_key?: string;
        model_id?: string | null;
        target_length: number;
        content_outline: string;
        key_points: string;
        title: string;
        article: string;
        article_char_count: number;
        created_at: string;
      }>
    | null;
  let error = primaryList.error;

  const shouldFallbackLegacySelect =
    !!error &&
    (error.code === '42703' || error.message.includes('model_key') || error.message.includes('model_id'));

  if (shouldFallbackLegacySelect) {
    const fallback = await supabase
      .from('generations')
      .select('id, target_length, content_outline, key_points, title, article, article_char_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    list = fallback.data
      ? fallback.data.map((item) => ({
          ...item,
          model_key: 'deepseek',
          model_id: 'deepseek-chat',
        }))
      : null;
    error = fallback.error;
  }

  if (error) {
    console.error('[Generations] list error:', error);
    return apiError('DB_ERROR', '获取列表失败');
  }

  return apiSuccess({ generations: list ?? [] });
}
