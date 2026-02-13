'use client';

import SiteHeader from './SiteHeader';
import { useLandingAuth } from '@/hooks/useLandingAuth';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageProps = {
  title: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
};

export default function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  const { currentUser, authLoading, handleAuthButtonClick } = useLandingAuth('/');

  return (
    <div className="min-h-screen bg-white text-[#141414]">
      <SiteHeader
        currentUser={currentUser}
        authLoading={authLoading}
        onAuthButtonClick={handleAuthButtonClick}
      />

      <main className="mx-auto w-full max-w-[1220px] px-5 pb-24 pt-16 sm:px-8 sm:pt-20">
        <section className="text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.04em] text-black sm:text-6xl">{title}</h1>
          <p className="mt-6 text-lg text-black/55">最后更新：{updatedAt}</p>
          {intro && <p className="mx-auto mt-5 max-w-3xl text-base leading-[1.85] text-black/62">{intro}</p>}
        </section>

        <section className="mx-auto mt-14 max-w-3xl space-y-12">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-black sm:text-4xl">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-base leading-[1.9] text-black/68 sm:text-[18px]"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {section.bullets.map((item) => (
                    <li
                      key={item}
                      className="text-base leading-[1.85] text-black/68 sm:text-[18px]"
                    >
                      • {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
