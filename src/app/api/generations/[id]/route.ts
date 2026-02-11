import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const { id } = params;

  // 验证UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return apiError('VALIDATION_ERROR', '无效的记录ID', 400);
  }

  // 删除记录（RLS自动确保只能删除自己的）
  const { data, error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .single();

  if (error) {
    console.error('[Generations] delete error:', error);
    // Supabase在记录不存在时也返回error
    if (error.code === 'PGRST116') {
      return apiError('NOT_FOUND', '记录不存在或无权限删除', 404);
    }
    return apiError('DB_ERROR', '删除失败，请稍后重试', 500);
  }

  return apiSuccess({ id: data?.id, message: '删除成功' });
}
