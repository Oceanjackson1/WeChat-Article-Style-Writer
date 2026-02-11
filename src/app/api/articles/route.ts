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

  const { data: list, error } = await supabase
    .from('user_articles')
    .select('id, filename, file_type, extracted_char_count, created_at, extracted_text')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Articles] list error:', error);
    return apiError('DB_ERROR', '获取文章列表失败');
  }

  const articles = (list ?? []).map((a) => ({
    id: a.id,
    filename: a.filename,
    file_type: a.file_type,
    extracted_char_count: a.extracted_char_count,
    created_at: a.created_at,
    preview: (a.extracted_text || '').slice(0, 500),
  }));

  return apiSuccess({ articles });
}
