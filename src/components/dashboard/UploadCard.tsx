'use client';

import { useCallback, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import ProgressBar from './ProgressBar';
import { useOptimisticProgress } from '@/hooks/useOptimisticProgress';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ALLOWED_EXT = ['.pdf', '.docx', '.txt'];
const MAX_SIZE = 10 * 1024 * 1024;

function isAllowedFile(f: File): boolean {
  if (f.size > MAX_SIZE) return false;
  const type = f.type?.toLowerCase() || '';
  const name = (f.name || '').toLowerCase();
  if (ALLOWED_MIMES.some((m) => type === m)) return true;
  return ALLOWED_EXT.some((ext) => name.endsWith(ext));
}

export type ArticleItem = {
  id: string;
  filename: string;
  file_type: string;
  extracted_char_count: number;
  created_at: string;
  preview: string;
};

type UploadProfile = {
  profile_json: Record<string, unknown> | null;
  profile_summary: string | null;
  updated_at: string | null;
} | null;

type Mode = 'add' | 'delete';

export default function UploadCard({
  articles = [],
  onSuccess,
  onDeleteSuccess,
}: {
  articles?: ArticleItem[];
  onSuccess: (profile?: UploadProfile) => void;
  onDeleteSuccess?: () => void;
}) {
  const [mode, setMode] = useState<Mode>('add');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const uploadProgress = useOptimisticProgress({
    stages: [
      { label: '上传文件中…', maxProgress: 30, duration: 4000 },
      { label: '解析内容…', maxProgress: 40, duration: 4000 },
      { label: '分析写作风格…', maxProgress: 30, duration: 4000 },
    ],
  });

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const valid = list.filter(isAllowedFile);
      if (valid.length === 0) {
        setMessage({ type: 'err', text: '请选择 PDF / TXT / DOCX 文件，单文件 ≤ 10MB' });
        return;
      }

      setUploading(true);
      setMessage(null);
      uploadProgress.start();

      const form = new FormData();
      valid.forEach((f) => form.append('files', f));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const json = await res.json();
        if (json.ok) {
          uploadProgress.complete();
          const profileError = json.data?.style_profile_error as string | null | undefined;
          const successCount = Number(json.data?.success_count ?? 0);
          setMessage({
            type: successCount > 0 && !profileError ? 'ok' : 'err',
            text: successCount > 0 && profileError
              ? `${json.data?.message || '上传成功'}（${profileError}）`
              : json.data?.message || '上传成功，风格画像已自动更新',
          });
          onSuccess((json.data?.style_profile as UploadProfile | undefined) ?? null);
        } else {
          uploadProgress.reset();
          setMessage({ type: 'err', text: json.error?.message || '上传失败' });
        }
      } catch (e) {
        uploadProgress.reset();
        setMessage({ type: 'err', text: '网络错误' });
      } finally {
        setUploading(false);
      }
    },
    [onSuccess, uploadProgress]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) doUpload(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) doUpload(files);
    e.target.value = '';
  };

  const handleDeleteConfirm = useCallback(async () => {
    setConfirmOpen(false);
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/articles/delete-all', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: 'ok', text: json.data?.message || '已清空已上传文件与风格画像' });
        onDeleteSuccess?.();
      } else {
        setMessage({ type: 'err', text: json.error?.message || '删除失败' });
      }
    } catch (e) {
      setMessage({ type: 'err', text: '网络错误' });
    } finally {
      setDeleting(false);
    }
  }, [onDeleteSuccess]);

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="text-base font-semibold text-neutral-900 mb-3">上传历史文章（风格库）</h2>

      <div className="flex rounded-xl bg-neutral-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => setMode('add')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'add' ? 'bg-white text-neutral-900 shadow-apple' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          添加材料
        </button>
        <button
          type="button"
          onClick={() => setMode('delete')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'delete' ? 'bg-white text-neutral-900 shadow-apple' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          删除历史
        </button>
      </div>

      {mode === 'add' && (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            支持 PDF、TXT、Word(.docx)，单文件 ≤ 10MB，可多选。新内容将与历史合并并参与风格分析。
          </p>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`border-2 border-dashed rounded-apple p-8 text-center transition-colors ${
              dragging ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 bg-neutral-50/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={onFileInput}
              disabled={uploading}
              className="hidden"
              id="upload-files"
            />
            <label
              htmlFor="upload-files"
              className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900"
            >
              {uploading ? '上传中…' : '拖拽文件到此处，或点击选择文件'}
            </label>
          </div>

          {uploadProgress.isActive && (
            <div className="mt-4">
              <ProgressBar progress={uploadProgress.progress} label={uploadProgress.label} />
            </div>
          )}
        </>
      )}

      {mode === 'delete' && (
        <div className="rounded-apple border border-neutral-200 bg-neutral-50/50 p-6">
          <p className="text-sm text-neutral-600 mb-4">
            将清空「已上传文件」与「风格画像」中的全部内容，此操作不可恢复。
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || articles.length === 0}
            className="px-4 py-2.5 rounded-apple text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {deleting ? '删除中…' : '删除全部历史'}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === 'ok' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      {articles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">已上传文件</h3>
          <ul className="space-y-2 rounded-apple border border-neutral-200 divide-y divide-neutral-100">
            {articles.map((a) => (
              <li key={a.id} className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-neutral-900 text-sm truncate">{a.filename}</span>
                  <span className="text-xs text-neutral-500 shrink-0">{a.extracted_char_count} 字</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-3">{a.preview || '—'}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="确认删除"
        message="确定要删除所有已上传文件和风格画像吗？此操作不可恢复。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
