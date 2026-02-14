'use client';

import { useState } from 'react';
import type { GenerationResult } from '@/app/dashboard/page';
import { MODEL_OPTIONS_FOR_UI } from '@/lib/model-config';
import ConfirmModal from './ConfirmModal';

const MODEL_LABEL_MAP = new Map(MODEL_OPTIONS_FOR_UI.map((item) => [item.key, item.label]));

function getModelLabel(modelKey?: string): string {
  if (!modelKey) return 'DeepSeek';
  return MODEL_LABEL_MAP.get(modelKey as (typeof MODEL_OPTIONS_FOR_UI)[number]['key']) ?? modelKey;
}

export default function HistoryCard({
  generations,
  loading,
  onSelect,
  onRefresh,
  onDelete,
}: {
  generations: GenerationResult[];
  loading: boolean;
  onSelect: (g: GenerationResult) => void;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;

    setDeleting(confirmDeleteId);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/generations/${confirmDeleteId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.ok) {
        // 调用父组件回调
        onDelete?.(confirmDeleteId);
        // 或直接刷新列表
        onRefresh();
      } else {
        console.error('Delete failed:', json.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(null);
    }
  };
  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-neutral-900">最近生成（最近 10 条）</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">加载中…</p>
      ) : generations.length === 0 ? (
        <p className="text-sm text-neutral-500">暂无记录</p>
      ) : (
        <ul className="space-y-2">
          {generations.map((g) => (
            <li key={g.id}>
              <div className="rounded-apple border border-neutral-200 hover:bg-neutral-50 transition-colors overflow-hidden">
                {/* 主内容区（可点击查看） */}
                <button
                  type="button"
                  onClick={() => onSelect(g)}
                  className="w-full text-left px-4 py-3"
                >
                  <span className="font-medium text-neutral-900 block truncate">{g.title || '无标题'}</span>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-neutral-500">
                      {g.article_char_count} 字 · {new Date(g.created_at).toLocaleString('zh-CN')}
                    </span>
                    <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
                      {getModelLabel(g.model_key)}
                    </span>
                  </div>
                </button>

                {/* 删除按钮区 */}
                <div className="border-t border-neutral-100 px-4 py-2 bg-neutral-50/50 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(g.id);
                    }}
                    disabled={deleting === g.id}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {deleting === g.id ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="确认删除"
        message="是否确定要删除，删除的内容将不可撤回"
        confirmLabel="删除"
        cancelLabel="取消"
        destructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </section>
  );
}
