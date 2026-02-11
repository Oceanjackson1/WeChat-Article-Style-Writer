import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { parseBuffer, normalizeMime } from '@/lib/parse';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

const BUCKET = 'user-articles';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error('[Upload] formData error:', e);
    return apiError('VALIDATION_ERROR', '请求体解析失败，请确认文件小于 10MB（Vercel 部署时建议单文件小于 4.5MB）');
  }
  const files = formData.getAll('files') as File[];
  const formKeys = Array.from(formData.keys());

  if (!files?.length) {
    const hint =
      formKeys.length === 0
        ? '请求体无表单字段，请检查是否选择了文件'
        : `表单字段: ${formKeys.join(', ')}（缺少 files）`;
    return apiError(
      'VALIDATION_ERROR',
      `未收到文件。${hint}。单文件请小于 4.5MB（Vercel 限制）。`
    );
  }

  const results: Array<{ filename: string; id?: string; error?: string }> = [];

  for (const file of files) {
    const filename = file.name?.trim() || 'unknown';
    const rawMime = file.type || '';
    const mime = normalizeMime(rawMime, filename);
    if (!mime) {
      results.push({ filename, error: '不支持的文件类型，仅支持 PDF / TXT / DOCX' });
      continue;
    }

    if (file.size > MAX_SIZE) {
      results.push({ filename, error: '单文件不能超过 10MB' });
      continue;
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${uuidv4()}-${safeName}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Upload] storage error:', uploadError);
        results.push({ filename, error: '上传存储失败' });
        continue;
      }

      const extractedText = await parseBuffer(buffer, mime);
      const extractedCharCount = extractedText.length;

      const { data: row, error: insertError } = await supabase
        .from('user_articles')
        .insert({
          user_id: user.id,
          filename,
          file_type: mime,
          storage_path: uploadData.path,
          extracted_text: extractedText,
          extracted_char_count: extractedCharCount,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[Upload] insert error:', insertError);
        results.push({ filename, error: '写入数据库失败' });
        continue;
      }

      results.push({ filename, id: row?.id });
    } catch (e) {
      console.error('[Upload] parse error:', e);
      results.push({ filename, error: '解析文件失败' });
    }
  }

  const successCount = results.filter((r) => !r.error).length;
  return apiSuccess({
    message: successCount
      ? '上传成功，现在可以填写文章提纲与核心观点并选择字数生成'
      : '没有文件上传成功',
    results,
  });
}
