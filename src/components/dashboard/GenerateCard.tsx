'use client';

import { useState } from 'react';
import { generateBodySchema } from '@/lib/zod-schemas';
import type { GenerationResult } from '@/app/dashboard/page';
import ProgressBar from './ProgressBar';
import { useOptimisticProgress } from '@/hooks/useOptimisticProgress';

const LENGTH_OPTIONS: number[] = [1500, 2500, 3500];

export default function GenerateCard({
  hasProfile,
  hasArticles,
  onSuccess,
}: {
  hasProfile: boolean;
  hasArticles: boolean;
  onSuccess: (result: GenerationResult) => void;
}) {
  const [targetLength, setTargetLength] = useState<number>(2500);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [contentOutline, setContentOutline] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [constraintConditions, setConstraintConditions] = useState('');
  const [authorPersona, setAuthorPersona] = useState('');
  const [concreteCases, setConcreteCases] = useState('');
  const [referenceSources, setReferenceSources] = useState('');
  const [includeSubheadings, setIncludeSubheadings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generateProgress = useOptimisticProgress({
    stages: [
      { label: '读取风格画像…', maxProgress: 25, duration: 8000 },
      { label: '构思文章框架…', maxProgress: 35, duration: 9000 },
      { label: '撰写正文…', maxProgress: 40, duration: 8000 },
    ],
  });

  async function handleGenerate() {
    // 确定最终字数
    let finalLength: number;
    if (isCustomMode) {
      const parsed = parseInt(customValue, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 10000) {
        setCustomError('请输入10000字以下的目标字数');
        return;
      }
      finalLength = parsed;
    } else {
      finalLength = targetLength;
    }

    const parsed = generateBodySchema.safeParse({
      target_length: finalLength,
      content_outline: contentOutline.trim(),
      key_points: keyPoints.trim(),
      constraint_conditions: constraintConditions.trim() || undefined,
      author_persona: authorPersona.trim() || undefined,
      concrete_cases: concreteCases.trim() || undefined,
      reference_sources: referenceSources.trim() || undefined,
      include_subheadings: includeSubheadings || undefined,
    });
    if (!parsed.success) {
      setErr(parsed.error.flatten().formErrors[0] || '请填写提纲与核心观点');
      return;
    }
    setErr(null);
    setCustomError(null);
    setLoading(true);
    generateProgress.start();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        generateProgress.complete();
        onSuccess({
          id: json.data.id,
          title: json.data.title,
          article: json.data.article,
          article_char_count: json.data.article_char_count,
          target_length: json.data.target_length,
          deviation_percent: json.data.deviation_percent,
          created_at: json.data.created_at,
        });
      } else {
        generateProgress.reset();
        setErr(json.error?.message || '生成失败');
      }
    } catch {
      generateProgress.reset();
      setErr('网络错误');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = hasArticles && (hasProfile || true);

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="text-base font-semibold text-neutral-900 mb-3">生成文章</h2>
      <p className="text-sm text-neutral-600 mb-4">
        选择目标字数，填写提纲与核心观点，系统将根据风格画像生成标题与正文
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">目标字数</label>
          <div className="flex gap-2 mb-3">
            {LENGTH_OPTIONS.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => {
                  setTargetLength(len);
                  setIsCustomMode(false);
                  setCustomError(null);
                }}
                className={`px-4 py-2 rounded-apple text-sm font-medium border transition-colors ${
                  targetLength === len && !isCustomMode
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {len}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                setCustomError(null);
              }}
              className={`px-4 py-2 rounded-apple text-sm font-medium border transition-colors ${
                isCustomMode
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              自定义
            </button>
          </div>
          {isCustomMode && (
            <div>
              <input
                type="number"
                min="1"
                max="10000"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setCustomError(null);
                }}
                placeholder="输入目标字数（1-10000）"
                className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
              {customError && (
                <p className="text-sm text-red-600 mt-1">{customError}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">文章提纲</label>
          <textarea
            value={contentOutline}
            onChange={(e) => setContentOutline(e.target.value)}
            placeholder="可用项目符号列出大纲，例如：\n• 背景与问题\n• 核心论点\n• 案例说明\n• 总结与建议"
            rows={4}
            className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">核心观点</label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="简要写出本文要传达的核心观点或结论"
            rows={3}
            className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {showAdvanced ? '收起进阶设置' : '展开进阶设置（可选）'}
          </button>
          {showAdvanced && (
            <div className="mt-3 rounded-apple border border-neutral-200 bg-neutral-50/60 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">约束性条件（可选）</label>
                <p className="text-xs text-neutral-500 mb-2">
                  反向提示词：填写不希望文章提到的内容，生成时会尽量避免。
                </p>
                <textarea
                  value={constraintConditions}
                  onChange={(e) => setConstraintConditions(e.target.value)}
                  placeholder="例如：不要提及竞品名称、不要写鸡汤式表达、避免夸张标题党"
                  rows={2}
                  className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">作者画像（可选）</label>
                <p className="text-xs text-neutral-500 mb-2">
                  设定作者身份与视角，文章会按该角色的表达方式与立场撰写。
                </p>
                <textarea
                  value={authorPersona}
                  onChange={(e) => setAuthorPersona(e.target.value)}
                  placeholder="例如：10年资深后端工程师，专注Vibe Coding与AI工程化实践"
                  rows={2}
                  className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">具体案例（可选）</label>
                <p className="text-xs text-neutral-500 mb-2">
                  填写你希望文章提到的经历、项目过程、故事场景或关键细节。
                </p>
                <textarea
                  value={concreteCases}
                  onChange={(e) => setConcreteCases(e.target.value)}
                  placeholder="例如：2025年重构支付模块时，通过灰度发布把故障率从3%降到0.2%"
                  rows={3}
                  className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">参考来源（可选）</label>
                <p className="text-xs text-neutral-500 mb-2">
                  填写希望参考的文章链接（`http://` 或 `https://`），可用逗号或换行分隔。
                </p>
                <textarea
                  value={referenceSources}
                  onChange={(e) => setReferenceSources(e.target.value)}
                  placeholder="http://example.com/a, https://example.com/b"
                  rows={3}
                  className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  在文章中加入小标题（可选）
                </label>
                <p className="text-xs text-neutral-500 mb-2">
                  开启后，正文会按不同模块自动加上小标题，结构更清晰、便于阅读。
                </p>
                <button
                  type="button"
                  aria-pressed={includeSubheadings}
                  onClick={() => setIncludeSubheadings((v) => !v)}
                  className={`px-4 py-2 rounded-apple text-sm font-medium border transition-colors ${
                    includeSubheadings
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  {includeSubheadings ? '已开启小标题' : '点击开启小标题'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasArticles && (
        <p className="text-sm text-amber-600 mt-2">请先上传至少一篇历史文章</p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !canGenerate}
        className="mt-4 px-5 py-2.5 rounded-apple bg-neutral-900 text-white text-sm font-medium shadow-apple hover:shadow-apple-hover disabled:opacity-60"
      >
        {loading ? '生成中…' : '生成'}
      </button>

      {generateProgress.isActive && (
        <div className="mt-4">
          <ProgressBar progress={generateProgress.progress} label={generateProgress.label} />
        </div>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </section>
  );
}
