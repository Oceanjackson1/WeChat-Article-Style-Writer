import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { buildStyleProfile } from '@/lib/build-style-profile';
import { deepseekChat } from '@/lib/deepseek';
import { generateBodySchema } from '@/lib/zod-schemas';
import { NextRequest } from 'next/server';

const TOLERANCE = 0.1; // ±10%
const MAX_RETRIES = 2;

function inTolerance(target: number, actual: number): boolean {
  const low = target * (1 - TOLERANCE);
  const high = target * (1 + TOLERANCE);
  return actual >= low && actual <= high;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '请求体必须是 JSON');
  }

  const parsed = generateBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] || '参数错误';
    return apiError('VALIDATION_ERROR', msg);
  }

  const { target_length, content_outline, key_points } = parsed.data;

  // 若无 style_profile 则先 rebuild（服务端内联调用，避免 fetch 无 cookie）
  let { data: profile } = await supabase
    .from('user_style_profiles')
    .select('profile_summary, profile_json')
    .eq('user_id', user.id)
    .single();

  if (!profile?.profile_summary) {
    try {
      const built = await buildStyleProfile(supabase, user.id);
      profile = {
        profile_summary: built.profile_summary,
        profile_json: built.profile_json,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请先上传历史文章并生成风格画像';
      return apiError('NO_STYLE_PROFILE', msg);
    }
  }

  const styleSummary = profile.profile_summary || JSON.stringify(profile.profile_json || {});

  const systemPrompt = `你是一位公众号写作助手。严格按照用户的写作风格（见风格摘要）和字数要求，根据提纲与核心观点生成一篇文章。

输出格式：必须且仅输出一个 JSON 对象，不要 markdown 代码块，不要其他文字。格式为：
{"title":"文章标题","article":"正文内容，使用\\n表示换行"}

要求：
- 标题简洁有力，符合风格摘要中的语气与风格。
- 正文严格遵循风格摘要中的：语气、结构、小标题密度、常用表达、段落节奏、开头与结尾模式。
- 正文字数（中英文均按字符计）必须尽量接近 target_length，允许 ±10% 偏差。`;

  const userPrompt = `目标字数（字符数）：${target_length}
文章提纲：\n${content_outline}

核心观点：\n${key_points}

写作风格摘要：\n${styleSummary}

请直接输出 JSON：{"title":"...","article":"..."}`;

  let raw: string;
  try {
    raw = await deepseekChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });
  } catch (e) {
    console.error('[Generate] DeepSeek error:', e);
    return apiError('AI_ERROR', '生成失败，请稍后重试');
  }

  let title = '';
  let article = '';
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const obj = JSON.parse(jsonMatch[0]) as { title?: string; article?: string };
      title = String(obj.title ?? '').trim();
      article = String(obj.article ?? '').replace(/\\n/g, '\n').trim();
    }
  } catch (e) {
    console.error('[Generate] parse JSON error:', e);
    return apiError('PARSE_ERROR', '生成结果解析失败');
  }

  let articleCharCount = article.length;
  let retries = 0;

  while (!inTolerance(target_length, articleCharCount) && retries < MAX_RETRIES) {
    const diff = target_length - articleCharCount;
    const action = diff > 0 ? '扩写' : '压缩润色';
    const adjustPrompt = `当前正文字符数约为 ${articleCharCount}，目标为 ${target_length}。请对下面正文进行${action}，使字数尽量接近 ${target_length}（允许 ±10%），保持风格不变。输出格式不变：仅输出 JSON {"title":"${title.replace(/"/g, '\\"')}","article":"..."}，正文用 \\n 换行。\n\n当前正文：\n${article.slice(0, 12000)}`;

    try {
      const adjustRaw = await deepseekChat({
        messages: [
          { role: 'system', content: '只输出 JSON {"title":"...","article":"..."}，不要其他内容。' },
          { role: 'user', content: adjustPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4096,
      });
      const match = adjustRaw.match(/\{[\s\S]*\}/);
      if (match) {
        const obj = JSON.parse(match[0]) as { title?: string; article?: string };
        article = String(obj.article ?? '').replace(/\\n/g, '\n').trim();
        articleCharCount = article.length;
      }
    } catch (e) {
      console.error('[Generate] adjust error:', e);
      break;
    }
    retries++;
  }

  const { data: gen, error: insertError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      target_length,
      content_outline,
      key_points,
      title,
      article,
      article_char_count: articleCharCount,
    })
    .select('id, title, article, article_char_count, target_length, created_at')
    .single();

  if (insertError) {
    console.error('[Generate] insert error:', insertError);
    return apiError('DB_ERROR', '保存生成记录失败');
  }

  const deviation =
    target_length > 0
      ? Math.round(((articleCharCount - target_length) / target_length) * 100)
      : 0;

  return apiSuccess({
    id: gen?.id,
    title: gen?.title,
    article: gen?.article,
    article_char_count: gen?.article_char_count,
    target_length: gen?.target_length,
    deviation_percent: deviation,
    created_at: gen?.created_at,
  });
}
