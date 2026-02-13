'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const workflowSteps = [
  {
    title: '上传历史文章',
    desc: '支持 PDF、TXT、DOCX，多文件上传；系统自动解析正文并建立你的风格库。',
  },
  {
    title: '生成风格画像',
    desc: '每次补充内容后自动更新风格摘要，覆盖语气、结构、小标题密度和常用表达。',
  },
  {
    title: '输入提纲并生成',
    desc: '填写提纲与核心观点，选择目标字数，一键生成标题与正文草稿。',
  },
];

const featureBlocks = [
  {
    id: 'style',
    title: '风格学习，而非模板套用',
    subtitle:
      '系统会根据你上传的历史文章自动分析写作习惯，后续生成内容会保持同样的语气、段落节奏与结构偏好。',
    points: [
      '自动生成可读风格摘要，便于检查是否“像你写的”',
      '支持查看结构化风格画像 JSON',
      '新增素材后自动更新画像，不需要手动训练',
    ],
    panelTitle: '风格画像摘要',
    panelRows: [
      ['语气风格', '专业、直接、克制'],
      ['结构偏好', '问题切入 → 拆解 → 建议'],
      ['小标题密度', '中高，3~6 个模块'],
      ['高频表达', '先说结论、再给理由'],
    ],
  },
  {
    id: 'generate',
    title: '按你的业务目标控制生成结果',
    subtitle:
      '除了提纲与核心观点，你还可以加入约束条件、作者画像、具体案例和参考来源，输出更可用。',
    points: [
      '目标字数：1500 / 2500 / 3500，或自定义 1~10000',
      '支持“小标题开关”，适配图文排版场景',
      '正文字数按目标控制，减少二次返工',
    ],
    panelTitle: '生成输入项',
    panelRows: [
      ['必填', '文章提纲、核心观点'],
      ['可选', '约束条件、作者画像'],
      ['可选', '具体案例、参考来源 URL'],
      ['控制项', '目标字数、小标题开关'],
    ],
  },
  {
    id: 'history',
    title: '从写作到复盘，一站式闭环',
    subtitle:
      '生成结果会自动进入历史列表，便于回看、比对和复用。你可以选中查看详情，也可删除不需要的版本。',
    points: [
      '展示最近 10 条生成记录（标题、字数、时间）',
      '支持单条删除，删除前二次确认',
      '支持复制标题与正文，直接用于发布流程',
    ],
    panelTitle: '工作台能力',
    panelRows: [
      ['风格库', '上传、补充、清空历史'],
      ['生成区', '提纲输入 + 目标字数控制'],
      ['输出区', '标题 / 正文 / 字数统计 / 复制'],
      ['历史区', '最近 10 条记录管理'],
    ],
  },
];

const faqList = [
  {
    q: '适合哪些公众号运营场景？',
    a: '适合品牌号、个人 IP、知识付费、内容团队等需要稳定输出图文的场景。',
  },
  {
    q: '是否支持自定义字数？',
    a: '支持。可在 1~10000 字内自定义目标字数，也可直接使用 1500 / 2500 / 3500 预设。',
  },
  {
    q: '可以保证完全和我原文一致吗？',
    a: '系统会尽量对齐你的风格画像，但仍建议对关键事实与观点进行人工复核。',
  },
];

const footerGroups = [
  {
    title: '产品',
    links: ['功能总览', '更新日志', '使用指南', '常见问题'],
  },
  {
    title: '能力',
    links: ['风格画像', '文章生成', '字数控制', '历史记录'],
  },
  {
    title: '支持',
    links: ['服务条款', '隐私政策', '数据控制', '联系我们'],
  },
];

function WenmaiLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 35c4-6 6-13 6-24 12-2 23-6 35-13-2 13-5 26-10 39-11 1-20 5-27 12"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 31 50 15"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 40c4-4 9-4 13 0l14 14c4 4 4 9 0 13L5 40Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 47 25 61"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
        fill="#FFC107"
      />
      <path
        d="M3.15308 7.3455L6.43858 9.755C7.32758 7.554 9.48058 6 12.0001 6C13.5296 6 14.9211 6.577 15.9806 7.5195L18.8091 4.691C17.0231 3.0265 14.6341 2 12.0001 2C8.15908 2 4.82808 4.1685 3.15308 7.3455Z"
        fill="#FF3D00"
      />
      <path
        d="M11.9999 22C14.5829 22 16.9299 21.0115 18.7044 19.404L15.6094 16.785C14.6054 17.5455 13.3574 18 11.9999 18C9.39891 18 7.19041 16.3415 6.35841 14.027L3.09741 16.5395C4.75241 19.778 8.11341 22 11.9999 22Z"
        fill="#4CAF50"
      />
      <path
        d="M21.8055 10.0415H21V10H12V14H17.6515C17.2555 15.1185 16.536 16.083 15.608 16.7855C15.6085 16.785 15.609 16.785 15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
        fill="#1976D2"
      />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setCurrentUser(user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    if (authLoading) return;
    setAuthLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback?next=/` },
    });
    if (error) {
      setAuthLoading(false);
      console.error(error);
      alert('登录失败：' + error.message);
    }
  }

  async function handleAuthButtonClick() {
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }

    const confirmed = window.confirm('确认退出登录吗？');
    if (!confirmed) return;

    setAuthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthLoading(false);
      console.error(error);
      alert('退出失败：' + error.message);
      return;
    }

    setCurrentUser(null);
    setAuthLoading(false);
  }

  function getUserInitial(user: User | null): string {
    const source = user?.email?.trim() || '';
    if (!source) return 'U';
    return source.charAt(0).toUpperCase();
  }

  function handleMainAction() {
    if (currentUser) {
      router.push('/dashboard');
      return;
    }
    signInWithGoogle();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm text-black/55">正在加载登录状态…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#141414]">
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1220px] items-center justify-between px-5 sm:px-8">
          <a
            href="#hero"
            className="flex items-center gap-3"
          >
            <WenmaiLogo className="h-9 w-9 text-black" />
            <span className="text-2xl font-semibold leading-none tracking-[-0.03em] text-black sm:text-3xl">
              文脉 AI
            </span>
          </a>

          <nav className="hidden items-center gap-10 text-[15px] font-medium text-black/85 md:flex">
            <a
              href="#flow"
              className="transition-colors hover:text-black/55"
            >
              流程
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-black/55"
            >
              功能
            </a>
            <a
              href="#faq"
              className="transition-colors hover:text-black/55"
            >
              常见问题
            </a>
          </nav>

          <button
            type="button"
            onClick={handleAuthButtonClick}
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

      <main className="overflow-x-hidden">
        <section
          id="hero"
          className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1220px] items-center px-5 py-10 sm:px-8 sm:py-14"
        >
          <div className="w-full rounded-[32px] border border-black/[0.08] bg-white p-8 sm:p-12 lg:p-14">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-black/45">
              公众号写作助手
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-black sm:text-5xl lg:text-6xl">
              上传你的历史文章，<br />
              让 AI 写得更像你
            </h1>

            <p className="mt-6 max-w-[860px] text-base leading-[1.85] text-black/60 sm:text-lg">
              面向微信公众号内容生产场景：导入历史素材、自动学习写作风格、按提纲与核心观点生成标题与正文，
              并支持字数控制与历史记录管理。
            </p>

            <div className="mt-10">
              <button
                type="button"
                onClick={handleMainAction}
                className="grid h-14 min-w-[280px] grid-cols-[20px_12px_max-content_1fr] items-center rounded-[999px] bg-[#1d1a1a] px-6 text-left text-base font-semibold text-[#f2f1f0] transition-colors duration-200 hover:bg-[#353535] active:bg-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              >
                {!currentUser ? (
                  <>
                    <GoogleMark />
                    <span />
                    <span>{authLoading ? '登录中…' : '使用 Google 账号登录'}</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                    <span />
                    <span>进入工作台</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                '支持 PDF / TXT / DOCX',
                '目标字数 1500 / 2500 / 3500',
                '支持自定义 1~10000 字',
                '最近 10 条生成记录',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-black/[0.12] bg-[#fafafa] px-4 py-1.5 text-xs text-black/65 sm:text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="flow"
          className="border-y border-black/[0.06] bg-white py-20"
        >
          <div className="mx-auto w-full max-w-[1220px] px-5 sm:px-8">
            <h2 className="text-center text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              三步完成一篇公众号草稿
            </h2>
            <p className="mx-auto mt-5 max-w-[860px] text-center text-base leading-[1.8] text-black/58 sm:text-lg">
              流程与后台能力一一对应：先建风格库，再生成画像，最后按提纲与核心观点产出正文。
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {workflowSteps.map((step, idx) => (
                <article
                  key={step.title}
                  className="rounded-3xl border border-black/[0.1] bg-[#fafafa] p-6"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    {idx + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-[1.8] text-black/60 sm:text-base">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="bg-white py-20"
        >
          <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-8 px-5 sm:px-8">
            <h2 className="text-center text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              功能文案与后台能力保持一致
            </h2>

            {featureBlocks.map((block) => (
              <article
                id={block.id}
                key={block.id}
                className="grid gap-7 rounded-[28px] border border-black/[0.1] bg-white p-7 lg:grid-cols-[1.05fr_1fr] lg:p-8"
              >
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-black sm:text-3xl">
                    {block.title}
                  </h3>
                  <p className="mt-4 text-sm leading-[1.85] text-black/60 sm:text-base">{block.subtitle}</p>
                  <ul className="mt-5 space-y-2.5">
                    {block.points.map((point) => (
                      <li
                        key={point}
                        className="text-sm leading-[1.75] text-black/72 sm:text-base"
                      >
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-black/[0.1] bg-[#fafafa] p-5">
                  <p className="text-sm font-semibold text-black/80">{block.panelTitle}</p>
                  <div className="mt-4 space-y-2">
                    {block.panelRows.map((row) => (
                      <div
                        key={row[0]}
                        className="grid grid-cols-[88px_1fr] gap-3 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5"
                      >
                        <span className="text-xs font-medium text-black/45 sm:text-sm">{row[0]}</span>
                        <span className="text-xs text-black/78 sm:text-sm">{row[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="border-t border-black/[0.06] bg-white py-20"
        >
          <div className="mx-auto w-full max-w-[1220px] px-5 sm:px-8">
            <div className="rounded-[28px] border border-black/[0.1] bg-white p-7 sm:p-9">
              <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-4xl">
                常见问题
              </h2>

              <div className="mt-7 space-y-5">
                {faqList.map((item) => (
                  <article
                    key={item.q}
                    className="rounded-2xl border border-black/[0.08] bg-[#fafafa] p-5"
                  >
                    <h3 className="text-base font-semibold text-black sm:text-lg">{item.q}</h3>
                    <p className="mt-2 text-sm leading-[1.85] text-black/62 sm:text-base">{item.a}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleMainAction}
                  className="h-12 rounded-[999px] bg-[#1d1a1a] px-7 text-sm font-semibold text-[#f2f1f0] transition-colors hover:bg-[#353535] active:bg-[#111111] sm:text-base"
                >
                  {currentUser ? '进入工作台，继续创作' : authLoading ? '登录中…' : '立即登录，开始生成第一篇草稿'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.08] bg-white py-14">
        <div className="mx-auto grid w-full max-w-[1220px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <WenmaiLogo className="h-9 w-9 text-black" />
              <p className="text-4xl font-semibold leading-none tracking-[-0.03em]">文脉 AI</p>
            </div>
            <p className="mt-4 text-sm leading-[1.85] text-black/58 sm:text-base">
              专注微信公众号写作场景：风格学习、内容生成、字数控制与版本管理一体化完成。
            </p>
            <p className="mt-7 text-xs text-black/42 sm:text-sm">
              © 2026 文脉 AI ｜ 服务条款 ｜ 隐私政策 ｜ 数据控制
            </p>
          </div>

          <div className="grid grid-cols-3 gap-7">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold text-black/55">{group.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li
                      key={link}
                      className="text-xs text-black/72 sm:text-sm"
                    >
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
