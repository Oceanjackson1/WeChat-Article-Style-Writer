import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { markInviteVerified } from '@/lib/model-access';
import { NextRequest } from 'next/server';

type VerifyBody = {
  invite_code?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return apiError('VALIDATION_ERROR', '请求体必须是 JSON');
  }

  const inviteCode = String(body.invite_code || '').trim();
  const expectedCode = process.env.MODEL_INVITE_CODE || 'ocean11';

  if (!inviteCode) {
    return apiError('VALIDATION_ERROR', '请输入邀请码');
  }

  if (inviteCode !== expectedCode) {
    return apiError('INVALID_INVITE_CODE', '邀请码填写错误，请重试');
  }

  try {
    await markInviteVerified(supabase, user.id);
    return apiSuccess({ invite_verified: true });
  } catch (error) {
    console.error('[ModelAccess] verify error:', error);
    if (error instanceof Error && error.message === 'INVITE_TABLE_MISSING') {
      return apiError('DB_ERROR', '数据库尚未升级，请先执行最新迁移后再验证邀请码');
    }
    return apiError('DB_ERROR', '邀请码验证失败，请稍后重试');
  }
}
