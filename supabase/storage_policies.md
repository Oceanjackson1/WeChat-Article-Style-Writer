# Storage Policies：user-articles 私有 Bucket

## 前置条件

- 在 Supabase Dashboard → **Storage** 中创建 bucket，名称为 **`user-articles`**
- 将 bucket 设为 **Private**（不勾选 Public）

## 策略目标

- 用户只能读写自己目录下的对象
- 存储路径格式：`{userId}/{uuid}-{filename}`，例如 `a1b2c3d4-.../e5f6...-report.pdf`

## Policy 示例（在 SQL Editor 或 Migration 中执行）

```sql
-- 允许用户读取自己前缀下的对象
CREATE POLICY "user_articles_storage_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户上传到自己前缀下
CREATE POLICY "user_articles_storage_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己前缀下的对象
CREATE POLICY "user_articles_storage_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己前缀下的对象
CREATE POLICY "user_articles_storage_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

说明：`(storage.foldername(name))[1]` 表示路径第一段目录名，即我们约定的 `userId`。上传时服务端必须使用路径 `{userId}/{uuid}-{filename}`，这样 RLS 才能正确放行。
