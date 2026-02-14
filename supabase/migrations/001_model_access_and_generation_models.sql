BEGIN;

-- 通用 updated_at 自动更新时间函数（可复用）
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 用户模型访问权限（邀请码）
CREATE TABLE IF NOT EXISTS public.user_model_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- generations 记录模型信息
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS model_key TEXT NOT NULL DEFAULT 'deepseek',
  ADD COLUMN IF NOT EXISTS model_id TEXT;

-- 旧数据回填（兼容已存在记录）
UPDATE public.generations
SET
  model_key = COALESCE(NULLIF(model_key, ''), 'deepseek'),
  model_id = COALESCE(NULLIF(model_id, ''), 'deepseek-chat');

-- 约束：限定可选模型 key（幂等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'generations_model_key_check'
  ) THEN
    ALTER TABLE public.generations
      ADD CONSTRAINT generations_model_key_check
      CHECK (model_key IN ('deepseek', 'grok', 'gpt_5_2', 'gemini', 'opus_4_6'));
  END IF;
END $$;

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_model_access_user_id ON public.user_model_access(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_model_key ON public.generations(model_key);

-- RLS
ALTER TABLE public.user_model_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_model_access_select_own" ON public.user_model_access;
CREATE POLICY "user_model_access_select_own"
ON public.user_model_access FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_model_access_insert_own" ON public.user_model_access;
CREATE POLICY "user_model_access_insert_own"
ON public.user_model_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_model_access_update_own" ON public.user_model_access;
CREATE POLICY "user_model_access_update_own"
ON public.user_model_access FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_model_access_delete_own" ON public.user_model_access;
CREATE POLICY "user_model_access_delete_own"
ON public.user_model_access FOR DELETE
USING (auth.uid() = user_id);

-- updated_at 自动维护
DROP TRIGGER IF EXISTS set_user_model_access_updated_at ON public.user_model_access;
CREATE TRIGGER set_user_model_access_updated_at
BEFORE UPDATE ON public.user_model_access
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT;
