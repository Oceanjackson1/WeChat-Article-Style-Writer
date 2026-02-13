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
}: {
  profile: ProfileState;
  loading: boolean;
}) {
  const [expandedSummary, setExpandedSummary] = useState(false);
  const updatedAtText = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleString('zh-CN')
    : null;
  const summary = profile?.profile_summary ?? '';
  const isLongSummary = summary.length > 260;

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="text-base font-semibold text-neutral-900 mb-3">风格画像（Style Profile）</h2>
      <p className="text-sm text-neutral-600 mb-4">
        每次上传或补充文件后，系统会自动完成分析并更新风格画像，用于后续生成文章
      </p>
      {updatedAtText && (
        <p className="text-xs text-neutral-500 mb-4">最近更新时间：{updatedAtText}</p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">加载中…</p>
      ) : profile?.profile_summary ? (
        <>
          <div className="mb-4">
            <div
              className={`rounded-apple border border-neutral-200 bg-neutral-50/50 p-4 text-sm text-neutral-700 whitespace-pre-wrap ${
                isLongSummary && !expandedSummary ? 'max-h-56 overflow-hidden' : ''
              }`}
            >
              {profile.profile_summary}
            </div>
            {isLongSummary && (
              <button
                type="button"
                onClick={() => setExpandedSummary((prev) => !prev)}
                className="mt-2 text-sm text-neutral-500 hover:text-neutral-900"
              >
                {expandedSummary ? '收起' : '展开'}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500 mb-4">
          暂无风格画像，请先上传历史文章。上传完成后会自动分析并产出画像。
        </p>
      )}
    </section>
  );
}
