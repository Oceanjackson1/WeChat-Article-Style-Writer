'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard');
        return;
      }
      setLoading(false);
    });
  }, [router]);

  async function signInWithGoogle() {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      console.error(error);
      alert('登录失败：' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <div className="text-neutral-500 text-sm">加载中…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col">
      <header className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-neutral-900">
            WeChat Article Style Writer
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 text-center mb-4">
          微信公众号风格写作助手
        </h1>
        <p className="text-neutral-600 text-center max-w-xl mb-2">
          上传你的历史公众号文章，系统学习你的写作风格，再根据提纲与核心观点，一键生成符合字数与风格的标题与正文。
        </p>
        <p className="text-neutral-500 text-sm text-center max-w-lg mb-12">
          支持 PDF、TXT、Word(.docx)；目标字数 1500 / 2500 / 3500 字。
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="px-8 py-3.5 rounded-apple bg-neutral-900 text-white text-sm font-medium shadow-apple hover:shadow-apple-hover transition-shadow"
        >
          使用 Google 登录
        </button>
      </main>

      <footer className="py-6 text-center text-neutral-400 text-xs">
        登录即表示同意使用本产品
      </footer>
    </div>
  );
}
