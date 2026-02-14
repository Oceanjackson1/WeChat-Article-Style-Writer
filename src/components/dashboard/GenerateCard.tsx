'use client';

import { useEffect, useState } from 'react';
import { generateBodySchema } from '@/lib/zod-schemas';
import { MODEL_OPTIONS_FOR_UI, type ModelKey } from '@/lib/model-config';
import type { GenerationResult } from '@/app/dashboard/page';
import ProgressBar from './ProgressBar';
import InviteCodeModal from './InviteCodeModal';
import { useOptimisticProgress } from '@/hooks/useOptimisticProgress';

const LENGTH_OPTIONS: number[] = [1500, 2500, 3500];

function pickValidationMessage(parsedError: {
  flatten: () => { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> };
}): string {
  const flattened = parsedError.flatten();
  if (flattened.formErrors[0]) return flattened.formErrors[0];
  for (const errors of Object.values(flattened.fieldErrors)) {
    if (errors?.[0]) return errors[0];
  }
  return '输入参数有误，请检查后重试';
}

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
  const [selectedModel, setSelectedModel] = useState<ModelKey>('deepseek');
  const [inviteVerified, setInviteVerified] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<ModelKey | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generateProgress = useOptimisticProgress({
    stages: [
      { label: '读取风格画像…', maxProgress: 25, duration: 8000 },
      { label: '构思文章框架…', maxProgress: 35, duration: 9000 },
      { label: '撰写正文…', maxProgress: 40, duration: 8000 },
    ],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadModelAccess() {
      try {
        const res = await fetch('/api/model-access');
        const json = await res.json();
        if (!cancelled && json.ok) {
          setInviteVerified(!!json.data?.invite_verified);
        }
      } catch {
        if (!cancelled) {
          setInviteVerified(false);
        }
      }
    }

    loadModelAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  function openInviteModal(modelKey: ModelKey) {
    setPendingModel(modelKey);
    setInviteCode('');
    setInviteError(null);
    setInviteModalOpen(true);
  }

  function closeInviteModal() {
    setInviteModalOpen(false);
    setPendingModel(null);
    setInviteCode('');
    setInviteError(null);
  }

  function handleSelectModel(modelKey: ModelKey, inviteRequired: boolean) {
    setErr(null);
    if (!inviteRequired || inviteVerified) {
      setSelectedModel(modelKey);
      return;
    }
    openInviteModal(modelKey);
  }

  async function handleInviteSubmit() {
    if (!pendingModel) return;

    const normalizedCode = inviteCode.trim();
    if (!normalizedCode) {
      setInviteError('请输入邀请码');
      return;
    }

    setInviteSubmitting(true);
    setInviteError(null);

    try {
      const res = await fetch('/api/model-access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: normalizedCode }),
      });
      const json = await res.json();
      if (json.ok) {
        setInviteVerified(true);
        setSelectedModel(pendingModel);
        closeInviteModal();
        return;
      }
      setInviteError(json.error?.message || '邀请码填写错误，请重试');
    } catch {
      setInviteError('网络错误，请稍后重试');
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleGenerate() {
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
      model_key: selectedModel,
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
      setErr(pickValidationMessage(parsed.error));
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
          model_key: json.data.model_key,
          model_id: json.data.model_id,
          title: json.data.title,
          article: json.data.article,
          article_char_count: json.data.article_char_count,
          target_length: json.data.target_length,
          deviation_percent: json.data.deviation_percent,
          created_at: json.data.created_at,
        });
      } else {
        generateProgress.reset();
        if (json.error?.code === 'INVITE_REQUIRED') {
          openInviteModal(selectedModel);
        }
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
  const pendingModelLabel =
    MODEL_OPTIONS_FOR_UI.find((item) => item.key === pendingModel)?.label || '所选模型';

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">生成文章</h2>
      <p className="mb-4 text-sm text-neutral-600">
        选择目标字数，填写提纲与核心观点，系统将根据风格画像生成标题与正文
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">目标字数</label>
          <div className="mb-3 flex gap-2">
            {LENGTH_OPTIONS.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => {
                  setTargetLength(len);
                  setIsCustomMode(false);
                  setCustomError(null);
                }}
                className={`rounded-apple border px-4 py-2 text-sm font-medium transition-colors ${
                  targetLength === len && !isCustomMode
                    ? 'border-neutral-900 bg-neutral-900 text-white'
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
              className={`rounded-apple border px-4 py-2 text-sm font-medium transition-colors ${
                isCustomMode
                  ? 'border-neutral-900 bg-neutral-900 text-white'
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
              {customError && <p className="mt-1 text-sm text-red-600">{customError}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">文章提纲</label>
          <textarea
            value={contentOutline}
            onChange={(e) => setContentOutline(e.target.value)}
            placeholder="可用项目符号列出大纲，例如：\n• 背景与问题\n• 核心论点\n• 案例说明\n• 总结与建议"
            rows={4}
            className="w-full rounded-apple border border-[hsl(var(--border))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">核心观点</label>
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
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            {showAdvanced ? '收起进阶设置' : '展开进阶设置（可选）'}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-4 rounded-apple border border-neutral-200 bg-neutral-50/60 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">约束性条件（可选）</label>
                <p className="mb-2 text-xs text-neutral-500">
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
                <label className="mb-1 block text-sm font-medium text-neutral-700">作者画像（可选）</label>
                <p className="mb-2 text-xs text-neutral-500">
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
                <label className="mb-1 block text-sm font-medium text-neutral-700">具体案例（可选）</label>
                <p className="mb-2 text-xs text-neutral-500">
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
                <label className="mb-1 block text-sm font-medium text-neutral-700">参考来源（可选）</label>
                <p className="mb-2 text-xs text-neutral-500">
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
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  在文章中加入小标题（可选）
                </label>
                <p className="mb-2 text-xs text-neutral-500">
                  开启后，正文会按不同模块自动加上小标题，结构更清晰、便于阅读。
                </p>
                <button
                  type="button"
                  aria-pressed={includeSubheadings}
                  onClick={() => setIncludeSubheadings((v) => !v)}
                  className={`rounded-apple border px-4 py-2 text-sm font-medium transition-colors ${
                    includeSubheadings
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {includeSubheadings ? '已开启小标题' : '点击开启小标题'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-apple border border-neutral-200 bg-neutral-50/60 p-4">
        <label className="mb-2 block text-sm font-medium text-neutral-700">模型选择</label>
        <div className="flex flex-wrap gap-2">
          {MODEL_OPTIONS_FOR_UI.map((model) => {
            const active = model.key === selectedModel;
            const locked = model.inviteRequired && !inviteVerified;
            return (
              <button
                key={model.key}
                type="button"
                onClick={() => handleSelectModel(model.key, model.inviteRequired)}
                className={`rounded-apple border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {model.label}
                {locked && <span className="ml-1 text-[11px] opacity-80">需邀请码</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">DeepSeek 无需邀请码，其他模型首次使用需先输入邀请码。</p>
        {inviteVerified && <p className="mt-1 text-xs text-emerald-600">邀请码已验证，可使用全部模型。</p>}
      </div>

      {!hasArticles && <p className="mt-2 text-sm text-amber-600">请先上传至少一篇历史文章</p>}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !canGenerate}
        className="mt-4 rounded-apple bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-apple hover:shadow-apple-hover disabled:opacity-60"
      >
        {loading ? '生成中…' : '生成'}
      </button>

      {generateProgress.isActive && (
        <div className="mt-4">
          <ProgressBar progress={generateProgress.progress} label={generateProgress.label} />
        </div>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      <InviteCodeModal
        open={inviteModalOpen}
        modelLabel={pendingModelLabel}
        inviteCode={inviteCode}
        inviteError={inviteError}
        submitting={inviteSubmitting}
        onChangeInviteCode={(value) => {
          setInviteCode(value);
          setInviteError(null);
        }}
        onClose={closeInviteModal}
        onSubmit={handleInviteSubmit}
      />
    </section>
  );
}
