'use client';

import { useState } from 'react';
import { generateBodySchema, type TargetLength } from '@/lib/zod-schemas';
import type { GenerationResult } from '@/app/dashboard/page';

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    });
    if (!parsed.success) {
      setErr(parsed.error.flatten().formErrors[0] || '请填写提纲与核心观点');
      return;
    }
    setErr(null);
    setCustomError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (json.ok && json.data) {
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
        setErr(json.error?.message || '生成失败');
      }
    } catch {
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
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </section>
  );
}
