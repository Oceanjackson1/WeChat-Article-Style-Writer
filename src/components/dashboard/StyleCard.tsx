'use client';

import { useState } from 'react';

type ProfileState = {
  profile_json: Record<string, unknown> | null;
  profile_summary: string | null;
  updated_at: string | null;
} | null;

export default function StyleCard({
  profile,
  loading,
  onRebuild,
  onRebuildSuccess,
}: {
  profile: ProfileState;
  loading: boolean;
  onRebuild: () => void;
  onRebuildSuccess: (data: { profile_summary?: string; profile_json?: Record<string, unknown> }) => void;
}) {
  const [rebuilding, setRebuilding] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleRebuild() {
    setRebuilding(true);
    setErr(null);
    try {
      const res = await fetch('/api/style-profile/rebuild', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        onRebuildSuccess(json.data);
        onRebuild();
      } else {
        setErr(json.error?.message || '生成失败');
      }
    } catch {
      setErr('网络错误');
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="text-base font-semibold text-neutral-900 mb-3">风格画像（Style Profile）</h2>
      <p className="text-sm text-neutral-600 mb-4">
        基于已上传文章生成写作风格摘要与 JSON 画像，用于生成时约束风格
      </p>

      {loading ? (
        <p className="text-sm text-neutral-500">加载中…</p>
      ) : profile?.profile_summary ? (
        <>
          <div className="rounded-apple border border-neutral-200 bg-neutral-50/50 p-4 text-sm text-neutral-700 whitespace-pre-wrap mb-4">
            {profile.profile_summary}
          </div>
          <button
            type="button"
            onClick={() => setShowJson((s) => !s)}
            className="text-sm text-neutral-500 hover:text-neutral-900 mb-2"
          >
            {showJson ? '收起 JSON' : '展开 JSON'}
          </button>
          {showJson && (
            <pre className="rounded-apple border border-neutral-200 bg-neutral-50 p-4 text-xs overflow-auto max-h-64 mb-4">
              {JSON.stringify(profile.profile_json, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <p className="text-sm text-neutral-500 mb-4">暂无风格画像，请先上传文章后点击下方按钮生成</p>
      )}

      <button
        type="button"
        onClick={handleRebuild}
        disabled={rebuilding}
        className="px-4 py-2 rounded-apple bg-neutral-900 text-white text-sm font-medium shadow-apple hover:shadow-apple-hover disabled:opacity-60"
      >
        {rebuilding ? '生成中…' : '重新生成风格画像'}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </section>
  );
}
