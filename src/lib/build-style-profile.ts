import type { SupabaseClient } from '@supabase/supabase-js';
import { deepseekChat } from '@/lib/deepseek';

export type BuildProfileResult = {
  profile_json: Record<string, unknown>;
  profile_summary: string;
};

const MAX_CHARS = 80000; // DeepSeek API 安全限制

export async function buildStyleProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<BuildProfileResult> {
  const { data: articles, error: fetchError } = await supabase
    .from('user_articles')
    .select('id, filename, extracted_text, extracted_char_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (fetchError) throw new Error('获取文章失败');
  if (!articles?.length) throw new Error('请先上传至少一篇历史文章');

  const combined = articles
    .map((a) => `【${a.filename}】\n${a.extracted_text || ''}`)
    .join('\n\n---\n\n');

  const systemPrompt = `你是一位写作风格分析师。根据用户提供的多篇公众号文章原文，提取其写作风格特征，输出严格的 JSON 和一段可读摘要。

输出要求：
1. 先输出一个 JSON 对象（不要 markdown 代码块包裹），包含：tone（语气，如正式/亲切/专业）、structure（结构特点）、heading_style（小标题风格与密度）、common_phrases（常用表达或句式，数组）、paragraph_rhythm（段落节奏描述）、opening_pattern（开头常见模式）、closing_pattern（结尾常见模式）、other_notes（其他备注）。
2. 然后输出一行 "---SUMMARY---"，再输出 8～12 行可读的风格摘要（中文），供后续生成文章时作为风格约束。`;

  // 应用安全限制，避免超出 API 限制
  const safeContent = combined.slice(0, MAX_CHARS);
  const userPrompt = `请分析以下公众号文章，提取写作风格并输出 JSON + 摘要：\n\n${safeContent}`;

  const raw = await deepseekChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  let profileJson: Record<string, unknown> = {};
  let profileSummary = '';

  const summaryIdx = raw.indexOf('---SUMMARY---');
  if (summaryIdx >= 0) {
    profileSummary = raw.slice(summaryIdx + '---SUMMARY---'.length).trim();
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      profileJson = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      profileSummary = profileSummary || raw.slice(0, 500);
    }
  } else {
    profileSummary = profileSummary || raw.slice(0, 500);
  }

  const { error: upsertError } = await supabase.from('user_style_profiles').upsert(
    {
      user_id: userId,
      profile_json: profileJson,
      profile_summary: profileSummary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) throw new Error('保存风格画像失败');

  return { profile_json: profileJson, profile_summary: profileSummary };
}
