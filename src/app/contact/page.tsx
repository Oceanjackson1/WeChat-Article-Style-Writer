'use client';

import ContactIllustration from '@/components/landing/ContactIllustration';
import SiteHeader from '@/components/landing/SiteHeader';
import { useLandingAuth } from '@/hooks/useLandingAuth';

export default function ContactPage() {
  const { currentUser, authLoading, handleAuthButtonClick } = useLandingAuth('/');

  return (
    <div className="min-h-screen bg-white text-[#141414]">
      <SiteHeader
        currentUser={currentUser}
        authLoading={authLoading}
        onAuthButtonClick={handleAuthButtonClick}
      />

      <main className="mx-auto grid w-full max-w-[1220px] items-center gap-12 px-5 pb-20 pt-28 sm:px-8 md:grid-cols-[1fr_1.1fr] md:pt-36">
        <section>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl">
            联系我们
          </h1>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black sm:text-3xl">电子邮箱</h2>
            <a
              href="mailto:nyt1154869180@gmail.com"
              className="mt-4 inline-block text-lg text-black/62 underline underline-offset-4 transition-colors hover:text-black sm:text-xl"
            >
              nyt1154869180@gmail.com
            </a>
          </div>

          <div className="mt-14">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black sm:text-3xl">关于我们</h2>
            <p className="mt-4 max-w-xl text-base leading-[1.9] text-black/62">
              文脉 AI 是一款专注于微信公众号内容创作的智能写作系统，帮助创作者稳定输出更像自己风格的高质量文章。
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-black/[0.08] bg-[#fafafa] p-6 sm:p-8">
          <ContactIllustration />
        </section>
      </main>
    </div>
  );
}
