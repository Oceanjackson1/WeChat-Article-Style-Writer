import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { getUserInviteVerified } from '@/lib/model-access';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  try {
    const invite_verified = await getUserInviteVerified(supabase, user.id);
    return apiSuccess({ invite_verified });
  } catch (error) {
    console.error('[ModelAccess] get error:', error);
    return apiError('DB_ERROR', '获取模型访问状态失败');
  }
}
