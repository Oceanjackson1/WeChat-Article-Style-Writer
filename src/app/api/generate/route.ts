import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { buildStyleProfile } from '@/lib/build-style-profile';
import { deepseekChat } from '@/lib/deepseek';
import { openrouterChat } from '@/lib/openrouter';
import { getModelConfig, isInviteRequired } from '@/lib/model-config';
import { getUserInviteVerified } from '@/lib/model-access';
import { generateBodySchema } from '@/lib/zod-schemas';
import { NextRequest } from 'next/server';

const TOLERANCE = 0.1; // ±10%
const MAX_RETRIES = 2;
const MAX_REFERENCE_URLS = 5;
const MAX_REFERENCE_CHARS_PER_URL = 3000;
const MAX_REFERENCE_TOTAL_CHARS = 12000;
const REFERENCE_FETCH_TIMEOUT_MS = 8000;
const MAX_STYLE_JSON_CHARS = 12000;

function inTolerance(target: number, actual: number): boolean {
  const low = target * (1 - TOLERANCE);
  const high = target * (1 + TOLERANCE);
  return actual >= low && actual <= high;
}

type ParsedReferenceSources = {
  urls: string[];
  invalid: string[];
  truncated: boolean;
};

function parseReferenceSources(raw: string | undefined): ParsedReferenceSources {
  if (!raw?.trim()) return { urls: [], invalid: [], truncated: false };

  const candidates = raw
    .split(/[\n,，]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const invalid: string[] = [];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    try {
      const parsed = new URL(item);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        invalid.push(item);
        continue;
      }
      parsed.hash = '';
      const normalized = parsed.toString();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    } catch {
      invalid.push(item);
    }
  }

  const truncated = urls.length > MAX_REFERENCE_URLS;
  return {
    urls: urls.slice(0, MAX_REFERENCE_URLS),
    invalid,
    truncated,
  };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchReferenceSnippet(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REFERENCE_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
        'User-Agent': 'WeChat-Article-Style-Writer/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const normalized = contentType.includes('html') ? htmlToText(rawText) : rawText;
    const compact = normalized.replace(/\s+/g, ' ').trim();
    return compact.slice(0, MAX_REFERENCE_CHARS_PER_URL);
  } finally {
    clearTimeout(timeout);
  }
}

async function buildReferenceSnippets(urls: string[]): Promise<{
  snippets: string[];
  warnings: string[];
}> {
  const snippets: string[] = [];
  const warnings: string[] = [];
  let totalChars = 0;

  for (const url of urls) {
    if (totalChars >= MAX_REFERENCE_TOTAL_CHARS) {
      warnings.push(`参考来源内容过长，已截断总参考字数（上限 ${MAX_REFERENCE_TOTAL_CHARS} 字）`);
      break;
    }

    try {
      const snippet = await fetchReferenceSnippet(url);
      if (!snippet) {
        warnings.push(`未能从 ${url} 提取有效文本`);
        continue;
      }

      const remain = MAX_REFERENCE_TOTAL_CHARS - totalChars;
      const clipped = snippet.slice(0, remain);
      totalChars += clipped.length;
      snippets.push(`来源：${url}\n内容摘要：${clipped}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '抓取失败';
      warnings.push(`读取 ${url} 失败（${msg}）`);
    }
  }

  return { snippets, warnings };
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

  const {
    model_key,
    target_length,
    content_outline,
    key_points,
    constraint_conditions,
    author_persona,
    concrete_cases,
    reference_sources,
    include_subheadings,
  } = parsed.data;

  const modelConfig = getModelConfig(model_key);
  let resolvedModelId = modelConfig.modelId;

  if (isInviteRequired(model_key)) {
    let inviteVerified = false;
    try {
      inviteVerified = await getUserInviteVerified(supabase, user.id);
    } catch (error) {
      console.error('[Generate] get invite status error:', error);
      return apiError('DB_ERROR', '获取邀请码状态失败');
    }

    if (!inviteVerified) {
      return apiError('INVITE_REQUIRED', '该模型需要先输入邀请码');
    }
  }

  const parsedReferences = parseReferenceSources(reference_sources);
  if (parsedReferences.invalid.length > 0) {
    const invalidPreview = parsedReferences.invalid.slice(0, 3).join('、');
    return apiError(
      'VALIDATION_ERROR',
      `参考来源仅支持 http:// 或 https:// 链接（可用逗号或换行分隔）。无效项：${invalidPreview}`
    );
  }

  const referenceData = await buildReferenceSnippets(parsedReferences.urls);

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
  const styleJsonText = JSON.stringify(profile.profile_json || {}, null, 2).slice(
    0,
    MAX_STYLE_JSON_CHARS
  );

  const advancedSections: string[] = [];
  if (constraint_conditions) {
    advancedSections.push(`【约束性条件（必须避免）】\n${constraint_conditions}`);
  }
  if (author_persona) {
    advancedSections.push(`【作者画像（写作身份/视角）】\n${author_persona}`);
  }
  if (concrete_cases) {
    advancedSections.push(`【具体案例（正文必须提及）】\n${concrete_cases}`);
  }
  if (parsedReferences.urls.length > 0) {
    advancedSections.push(`【参考来源 URL】\n${parsedReferences.urls.join('\n')}`);
  }
  if (referenceData.snippets.length > 0) {
    advancedSections.push(`【参考来源摘录（用于事实参考）】\n${referenceData.snippets.join('\n\n')}`);
  }
  if (include_subheadings) {
    advancedSections.push('【在文章中加入小标题】是。请按模块组织内容，每个模块使用简洁明确的小标题。');
  }

  const advancedPrompt =
    advancedSections.length > 0
      ? advancedSections.join('\n\n')
      : '无（用户未填写进阶可选项）';

  const systemPrompt = `你是一位公众号写作助手。严格按照用户的写作风格（见风格摘要）和字数要求，根据提纲与核心观点生成一篇文章。

输出格式：必须且仅输出一个 JSON 对象，不要 markdown 代码块，不要其他文字。格式为：
{"title":"文章标题","article":"正文内容，使用\\n表示换行"}

要求：
- 标题简洁有力，符合风格摘要中的语气与风格。
- 正文严格遵循风格摘要中的：语气、结构、小标题密度、常用表达、段落节奏、开头与结尾模式。
- 若画像中存在“特殊句式/口头禅/高频起句与收句/标点习惯”，请在不生硬堆砌的前提下复用其写法特征。
- 正文字数（中英文均按字符计）必须尽量接近 target_length，允许 ±10% 偏差。
- 若用户提供“约束性条件”，必须严格避免出现这些内容。
- 若用户提供“作者画像”，必须以该身份与视角组织表达。
- 若用户提供“具体案例”，正文必须自然提及并与论点相关联。
- 若用户提供“参考来源摘录”，优先基于摘录内容组织事实，不要凭空编造。
- 若用户开启“在文章中加入小标题”，正文应按模块使用小标题组织，每个小标题单独一行且与段落内容对应。`;

  const userPrompt = `目标字数（字符数）：${target_length}
文章提纲：\n${content_outline}

核心观点：\n${key_points}

写作风格摘要：\n${styleSummary}

写作风格画像JSON（需共同遵循）：\n${styleJsonText}

进阶可选设置（若有内容必须执行）：\n${advancedPrompt}

请直接输出 JSON：{"title":"...","article":"..."}`;

  async function chatWithSelectedModel(options: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature: number;
    max_tokens: number;
  }): Promise<string> {
    if (modelConfig.provider === 'deepseek') {
      resolvedModelId = modelConfig.modelId;
      return deepseekChat(options);
    }
    const modelCandidates = [modelConfig.modelId, ...(modelConfig.fallbackModelIds || [])];
    let lastError: unknown;

    for (const modelId of modelCandidates) {
      try {
        const result = await openrouterChat({
          model: modelId,
          messages: options.messages,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });
        resolvedModelId = modelId;
        return result;
      } catch (error) {
        lastError = error;
        console.error('[Generate] OpenRouter candidate failed:', model_key, modelId, error);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('OpenRouter request failed after trying fallback models');
  }

  let raw: string;
  try {
    raw = await chatWithSelectedModel({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '模型调用失败';
    console.error('[Generate] model error:', model_key, modelConfig.modelId, msg);
    if (msg.includes('OPENROUTER_API_KEY is not set')) {
      return apiError('CONFIG_ERROR', 'OpenRouter API Key 未配置，请先在环境变量中设置');
    }
    if (msg.includes('OpenRouter API')) {
      const concise = msg.replace(/^OpenRouter API\s*/i, '').slice(0, 220);
      return apiError('AI_ERROR', `OpenRouter 调用失败：${concise}`);
    }
    return apiError('AI_ERROR', `模型调用失败：${msg}`);
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

  const adjustMustKeep: string[] = [];
  if (constraint_conditions) adjustMustKeep.push(`- 继续严格满足约束性条件：${constraint_conditions}`);
  if (author_persona) adjustMustKeep.push(`- 保持作者画像与叙述视角：${author_persona}`);
  if (concrete_cases) adjustMustKeep.push(`- 保留并自然提及具体案例：${concrete_cases}`);
  if (parsedReferences.urls.length > 0)
    adjustMustKeep.push('- 保持与参考来源一致，不引入明显冲突的事实陈述');
  if (referenceData.snippets.length > 0)
    adjustMustKeep.push('- 已引用的参考信息请继续保留核心事实');
  if (include_subheadings)
    adjustMustKeep.push('- 保持按模块的小标题结构，不要移除小标题');

  const adjustRules =
    adjustMustKeep.length > 0
      ? `\n额外要求（必须保持）：\n${adjustMustKeep.join('\n')}`
      : '';

  while (!inTolerance(target_length, articleCharCount) && retries < MAX_RETRIES) {
    const diff = target_length - articleCharCount;
    const action = diff > 0 ? '扩写' : '压缩润色';
    const adjustPrompt = `当前正文字符数约为 ${articleCharCount}，目标为 ${target_length}。请对下面正文进行${action}，使字数尽量接近 ${target_length}（允许 ±10%），保持风格与事实不变。输出格式不变：仅输出 JSON {"title":"${title.replace(/"/g, '\\"')}","article":"..."}，正文用 \\n 换行。${adjustRules}\n\n当前正文：\n${article.slice(0, 12000)}`;

    try {
      const adjustRaw = await chatWithSelectedModel({
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

  const baseInsertPayload = {
    user_id: user.id,
    target_length,
    content_outline,
    key_points,
    title,
    article,
    article_char_count: articleCharCount,
  };

  const primaryInsert = await supabase
    .from('generations')
    .insert({
      ...baseInsertPayload,
      model_key,
      model_id: resolvedModelId,
    })
    .select('id, model_key, model_id, title, article, article_char_count, target_length, created_at')
    .single();

  let gen = primaryInsert.data as
    | {
        id?: string;
        model_key?: string;
        model_id?: string;
        title?: string;
        article?: string;
        article_char_count?: number;
        target_length?: number;
        created_at?: string;
      }
    | null;
  let insertError = primaryInsert.error;

  const shouldFallbackLegacyInsert =
    !!insertError &&
    (insertError.code === '42703' ||
      insertError.message.includes('model_key') ||
      insertError.message.includes('model_id'));

  if (shouldFallbackLegacyInsert) {
    const fallback = await supabase
      .from('generations')
      .insert(baseInsertPayload)
      .select('id, title, article, article_char_count, target_length, created_at')
      .single();
    gen = fallback.data
      ? {
          ...fallback.data,
          model_key,
          model_id: resolvedModelId,
        }
      : null;
    insertError = fallback.error;
  }

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
    model_key: gen?.model_key ?? model_key,
    model_id: gen?.model_id ?? resolvedModelId,
    title: gen?.title,
    article: gen?.article,
    article_char_count: gen?.article_char_count,
    target_length: gen?.target_length,
    deviation_percent: deviation,
    created_at: gen?.created_at,
    reference_warnings: referenceData.warnings,
    reference_urls_used: parsedReferences.urls,
    reference_urls_truncated: parsedReferences.truncated,
  });
}
