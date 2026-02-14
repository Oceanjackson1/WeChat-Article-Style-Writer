'use client';

type InviteCodeModalProps = {
  open: boolean;
  modelLabel: string;
  inviteCode: string;
  inviteError: string | null;
  submitting: boolean;
  onChangeInviteCode: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function InviteCodeModal({
  open,
  modelLabel,
  inviteCode,
  inviteError,
  submitting,
  onChangeInviteCode,
  onClose,
  onSubmit,
}: InviteCodeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-code-title"
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-white/60 bg-white shadow-[0_30px_80px_-25px_rgba(0,0,0,0.35)]">
        <div className="bg-gradient-to-b from-neutral-50 to-white px-6 pt-6 pb-4">
          <p className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
            模型解锁
          </p>
          <h2 id="invite-code-title" className="mt-3 text-xl font-semibold tracking-[-0.02em] text-neutral-900">
            输入邀请码以使用 {modelLabel}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            邀请码只需验证一次，验证成功后可直接使用 Grok、GPT 5.2、Gemini、Opus 4.6。
          </p>
        </div>

        <form
          className="px-6 pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label htmlFor="invite-code-input" className="mb-2 block text-sm font-medium text-neutral-700">
            邀请码
          </label>
          <input
            id="invite-code-input"
            type="password"
            autoFocus
            value={inviteCode}
            onChange={(e) => onChangeInviteCode(e.target.value)}
            placeholder="请输入邀请码"
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
              {submitting ? '验证中…' : '验证并解锁'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
