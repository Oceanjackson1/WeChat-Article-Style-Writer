-- =============================================================================
-- WeChat Article Style Writer - Supabase 完整 schema（可重复执行）
-- 包含：表结构、索引、表 RLS、Storage 策略
-- 在 SQL Editor 中一次性执行即可
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Storage 策略（storage.objects，bucket: user-articles）
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_articles_storage_select_own" ON storage.objects;
CREATE POLICY "user_articles_storage_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "user_articles_storage_insert_own" ON storage.objects;
CREATE POLICY "user_articles_storage_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "user_articles_storage_update_own" ON storage.objects;
CREATE POLICY "user_articles_storage_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "user_articles_storage_delete_own" ON storage.objects;
CREATE POLICY "user_articles_storage_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- 2. 表结构
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  extracted_char_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_style_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_json JSONB,
  profile_summary TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_length INT NOT NULL,
  content_outline TEXT NOT NULL,
  key_points TEXT NOT NULL,
  title TEXT,
  article TEXT,
  article_char_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. 索引
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_articles_user_id ON user_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. 表 RLS 开启
-- -----------------------------------------------------------------------------
ALTER TABLE user_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. user_articles 表策略
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_articles_select_own" ON user_articles;
CREATE POLICY "user_articles_select_own" ON user_articles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_articles_insert_own" ON user_articles;
CREATE POLICY "user_articles_insert_own" ON user_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_articles_update_own" ON user_articles;
CREATE POLICY "user_articles_update_own" ON user_articles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_articles_delete_own" ON user_articles;
CREATE POLICY "user_articles_delete_own" ON user_articles FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. user_style_profiles 表策略
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_style_profiles_select_own" ON user_style_profiles;
CREATE POLICY "user_style_profiles_select_own" ON user_style_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_style_profiles_insert_own" ON user_style_profiles;
CREATE POLICY "user_style_profiles_insert_own" ON user_style_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_style_profiles_update_own" ON user_style_profiles;
CREATE POLICY "user_style_profiles_update_own" ON user_style_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_style_profiles_delete_own" ON user_style_profiles;
CREATE POLICY "user_style_profiles_delete_own" ON user_style_profiles FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 7. generations 表策略
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "generations_select_own" ON generations;
CREATE POLICY "generations_select_own" ON generations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "generations_insert_own" ON generations;
CREATE POLICY "generations_insert_own" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "generations_update_own" ON generations;
CREATE POLICY "generations_update_own" ON generations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "generations_delete_own" ON generations;
CREATE POLICY "generations_delete_own" ON generations FOR DELETE USING (auth.uid() = user_id);
