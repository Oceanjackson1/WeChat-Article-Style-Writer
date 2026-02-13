'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import WenmaiLogo from '@/components/WenmaiLogo';

export default function DashboardNav({ user }: { user: User }) {
  const router = useRouter();
  const email = user.email ?? '';
  const avatarUrl = user.user_metadata?.avatar_url;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-neutral-900">
          <WenmaiLogo className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-[-0.02em]">文脉 AI</span>
        </div>
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-neutral-200"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs">
              {email.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-sm text-neutral-600 max-w-[180px] truncate">
            {email}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
