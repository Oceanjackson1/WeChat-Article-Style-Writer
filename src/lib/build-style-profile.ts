import type { SupabaseClient } from '@supabase/supabase-js';
import { deepseekChat } from '@/lib/deepseek';

export type BuildProfileResult = {
  profile_json: Record<string, unknown>;
  profile_summary: string;
};

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

  const systemPrompt = `你是一位公众号写作风格分析专家。请基于用户历史文章，抽取可复用、可执行、可约束生成模型的“高精度风格画像”。

输出格式必须严格遵守：
1. 第一部分必须是一个 JSON 对象（不允许 markdown 代码块），字段如下：
{
  "tone": {
    "primary": "主语气",
    "secondary": ["次级语气1", "次级语气2"],
    "emotional_temperature": "冷静/中性/热烈等",
    "formality": "正式度描述"
  },
  "persona": {
    "author_role": "作者人设",
    "audience": "目标读者画像",
    "relationship_distance": "与读者距离感"
  },
  "structure": {
    "overall_pattern": "常见结构模板",
    "section_count_range": "常见段落/小节数量",
    "logic_flow": ["常见逻辑步骤1", "步骤2", "步骤3"]
  },
  "heading_style": {
    "density": "小标题密度",
    "style": "小标题语气/句式",
    "examples": ["小标题样式示例1", "示例2"]
  },
  "paragraph_rhythm": {
    "avg_paragraph_length": "段落长度倾向",
    "sentence_pattern": "长短句搭配特点",
    "pace": "节奏描述"
  },
  "language_features": {
    "high_frequency_expressions": ["高频表达1", "高频表达2"],
    "domain_terms": ["垂类术语1", "术语2"],
    "rhetorical_devices": ["常见修辞1", "修辞2"],
    "forbidden_patterns": ["应避免的表达1", "表达2"]
  },
  "signature_expression": {
    "catchphrases": ["作者口头禅/标志短语1", "短语2"],
    "recurring_sentence_openers": ["高频起句1", "高频起句2"],
    "recurring_sentence_enders": ["高频收句1", "高频收句2"],
    "signature_sentence_patterns": [
      "句式模板1（例如：先抛结论，再给三点展开）",
      "句式模板2"
    ],
    "punctuation_habits": ["标点习惯1", "标点习惯2"],
    "evidence_examples": ["来自原文的短句证据1", "短句证据2"]
  },
  "argumentation": {
    "evidence_style": "论据类型偏好",
    "reasoning_style": "论证方式",
    "typical_transition": ["常见过渡句1", "过渡句2"]
  },
  "opening_pattern": {
    "strategy": "开头策略",
    "templates": ["模板1", "模板2"]
  },
  "closing_pattern": {
    "strategy": "结尾策略",
    "templates": ["模板1", "模板2"],
    "cta_style": "行动号召方式"
  },
  "content_preference": {
    "preferred_topics": ["偏好主题1", "主题2"],
    "taboo_topics": ["回避主题1", "主题2"],
    "narrative_viewpoint": "第一人称/第三人称倾向"
  },
  "quality_checklist": [
    "生成文章时必须满足的检查点1",
    "检查点2",
    "检查点3"
  ],
  "imitation_rules": [
    "仿写规则1",
    "仿写规则2",
    "仿写规则3"
  ],
  "other_notes": "其他补充"
}
2. 第二部分必须输出一行 "---SUMMARY---"。
3. 第三部分输出“结构化风格摘要”（中文，24~36 行），必须使用分区标题 + 分点列表，格式示例：
【语气与人设】
- ...
- ...
【特殊句式与表达习惯】
- ...
- ...
请至少覆盖：语气人设、结构模板、小标题策略、段落节奏、语言偏好、特殊句式与口头禅、论证方式、开头策略、结尾策略、仿写规则、质量检查清单。
4. “特殊句式与表达习惯”必须具体、可执行，不要空泛描述。`;

  const userPrompt = `请分析以下公众号文章，提取写作风格并输出 JSON + 摘要：\n\n${combined}`;

  const raw = await deepseekChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
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
      profileSummary = profileSummary || raw;
    }
  } else {
    profileSummary = profileSummary || raw;
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
