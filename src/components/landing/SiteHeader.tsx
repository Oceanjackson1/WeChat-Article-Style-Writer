'use client';

import type { User } from '@supabase/supabase-js';
import WenmaiLogo from '@/components/WenmaiLogo';
import { getUserInitial } from '@/hooks/useLandingAuth';

type SiteHeaderProps = {
  currentUser: User | null;
  authLoading: boolean;
  onAuthButtonClick: () => void | Promise<void>;
  useHashLinks?: boolean;
};

export default function SiteHeader({
  currentUser,
  authLoading,
  onAuthButtonClick,
  useHashLinks = false,
}: SiteHeaderProps) {
  const navItems = [
    { label: '流程', href: useHashLinks ? '#flow' : '/#flow' },
    { label: '功能', href: useHashLinks ? '#features' : '/#features' },
    { label: '常见问题', href: useHashLinks ? '#faq' : '/#faq' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1220px] items-center justify-between px-5 sm:px-8">
        <a
          href={useHashLinks ? '#hero' : '/'}
          className="flex items-center gap-3"
        >
          <WenmaiLogo className="h-9 w-9 text-black" />
          <span className="text-2xl font-semibold leading-none tracking-[-0.03em] text-black sm:text-3xl">
            文脉 AI
          </span>
        </a>

        <nav className="hidden items-center gap-10 text-[16px] font-medium text-black/85 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-black/55"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onAuthButtonClick}
          disabled={authLoading}
          aria-label={currentUser ? '退出登录' : '登录'}
          title={currentUser ? '点击退出登录' : '点击登录'}
          className={`transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            currentUser
              ? 'flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f1f1] text-sm font-semibold text-black/62'
              : 'h-11 rounded-[999px] bg-[#1d1a1a] px-6 text-sm font-semibold text-white hover:bg-[#353535] active:bg-[#111111]'
          }`}
        >
          {currentUser ? getUserInitial(currentUser) : authLoading ? '登录中…' : '登录'}
        </button>
      </div>
    </header>
  );
}
