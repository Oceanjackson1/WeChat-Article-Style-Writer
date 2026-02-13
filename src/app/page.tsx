'use client';

import { useRouter } from 'next/navigation';
import WenmaiLogo from '@/components/WenmaiLogo';
import SiteHeader from '@/components/landing/SiteHeader';
import { useLandingAuth } from '@/hooks/useLandingAuth';

const workflowSteps = [
  {
    title: '上传历史文章',
    desc: '支持 PDF、TXT、DOCX 多文件上传；系统自动解析正文并沉淀你的风格基础数据。',
  },
  {
    title: '生成风格画像',
    desc: '每次补充素材后自动更新风格摘要，覆盖语气、结构节奏与表达习惯。',
  },
  {
    title: '输入提纲并生成',
    desc: '填写提纲与核心观点，可叠加进阶条件后，一键产出标题与正文草稿。',
  },
];

const featureBlocks = [
  {
    id: 'style',
    title: '从历史文章自动建立你的风格基线',
    subtitle:
      '文脉 AI 会在你上传历史内容后自动完成解析与画像更新，后续生成会优先遵循你的语气、段落组织与常用表达习惯。',
    points: [
      '支持 PDF / TXT / DOCX 历史文章导入并解析正文',
      '每次补充素材后自动重建风格画像摘要',
      '长内容支持展开/收起，方便快速校对风格是否到位',
    ],
    panelTitle: '风格学习机制',
    panelRows: [
      ['输入来源', '历史文章正文'],
      ['自动提取', '语气、结构、节奏、表达偏好'],
      ['更新时机', '每次上传后自动触发'],
      ['前台呈现', '可读摘要（非技术化展示）'],
    ],
  },
  {
    id: 'generate',
    title: '按业务目标定制每一篇内容输出',
    subtitle:
      '除了提纲与核心观点，你还可以补充约束条件、作者画像、具体案例与参考来源，让生成结果更可发布、更贴近业务语境。',
    points: [
      '支持预设字数 1500 / 2500 / 3500 与 1~10000 自定义',
      '支持“在正文中加入小标题”开关，增强结构可读性',
      '支持参考来源 URL 抓取摘要，降低事实偏差风险',
    ],
    panelTitle: '生成可控项',
    panelRows: [
      ['必填', '文章提纲、核心观点'],
      ['可选', '约束条件、作者画像、具体案例'],
      ['可选', '参考来源 URL（支持多条）'],
      ['控制项', '目标字数、小标题开关'],
    ],
  },
  {
    id: 'history',
    title: '从生成到复盘，形成持续创作闭环',
    subtitle:
      '生成结果会自动进入历史记录，便于选中查看、对比版本、清理无效内容，并把可用标题与正文直接复制到发布流程。',
    points: [
      '自动保留最近 10 条生成记录（标题、字数、时间）',
      '支持单条删除并进行删除确认',
      '支持一键复制标题与正文，提高发布效率',
    ],
    panelTitle: '工作台能力映射',
    panelRows: [
      ['素材区', '上传、补充、删除历史文章'],
      ['画像区', '自动更新风格摘要'],
      ['生成区', '提纲输入 + 进阶控制'],
      ['历史区', '最近 10 条记录管理'],
    ],
  },
];

const faqList = [
  {
    q: '适合哪些公众号团队或创作者？',
    a: '适合品牌号、个人 IP、知识内容团队与代运营团队，尤其适用于需要稳定产出、统一风格的场景。',
  },
  {
    q: '可以自定义字数吗？',
    a: '可以。除 1500 / 2500 / 3500 预设外，还支持在 1~10000 字范围内自定义目标字数。',
  },
  {
    q: '是否支持按真实案例和资料来源生成？',
    a: '支持。你可填写具体案例并附上参考来源 URL，系统会提取摘要用于辅助生成。',
  },
];

const footerGroups = [
  {
    title: '产品',
    links: [
      { label: '功能总览', href: '/#features' },
      { label: '常见问题', href: '/#faq' },
      { label: '联系我们', href: '/contact' },
      { label: '关于我们', href: '/contact' },
    ],
  },
  {
    title: '能力',
    links: [
      { label: '风格画像', href: '/#features' },
      { label: '内容生成', href: '/#features' },
      { label: '字数控制', href: '/#features' },
      { label: '历史管理', href: '/#features' },
    ],
  },
  {
    title: '政策',
    links: [
      { label: '服务条款', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '数据控制', href: '/data-controls' },
      { label: '联系我们', href: '/contact' },
    ],
  },
];

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
  const { loading, authLoading, currentUser, handleAuthButtonClick, signInWithGoogle } =
    useLandingAuth('/');

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
      <SiteHeader
        currentUser={currentUser}
        authLoading={authLoading}
        onAuthButtonClick={handleAuthButtonClick}
        useHashLinks
      />

      <main className="overflow-x-hidden">
        <section
          id="hero"
          className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1220px] items-center px-5 py-10 sm:px-8 sm:py-14"
        >
          <div className="w-full rounded-[32px] border border-black/[0.08] bg-white p-8 sm:p-12 lg:p-14">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-black/45">公众号写作助手</p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-black sm:text-5xl lg:text-6xl">
              上传你的历史文章，<br />
              让 AI 写得更像你
            </h1>

            <p className="mt-6 max-w-[860px] text-base leading-[1.85] text-black/60 sm:text-lg">
              面向微信公众号内容生产场景：导入历史素材、自动学习写作风格、按提纲与核心观点生成标题与正文，
              并支持字数控制、进阶约束与历史记录管理。
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
                '支持进阶控制项与参考来源',
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
              流程与后台能力一一对应：先建风格库，再更新画像，最后按提纲与核心观点生成内容。
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
              满足用户定制化创作需求
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
              <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-4xl">常见问题</h2>

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
        <div className="mx-auto w-full max-w-[1220px] px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <WenmaiLogo className="h-9 w-9 text-black" />
                <p className="text-4xl font-semibold leading-none tracking-[-0.03em]">文脉 AI</p>
              </div>
              <p className="mt-4 text-sm leading-[1.85] text-black/58 sm:text-base">
                专注微信公众号写作场景：风格学习、内容生成、字数控制与版本管理一体化完成。
              </p>
              <p className="mt-7 text-xs text-black/42 sm:text-sm">
                © 2026 文脉 AI ｜
                <a
                  href="/terms"
                  className="ml-1 hover:text-black"
                >
                  服务条款
                </a>{' '}
                ｜
                <a
                  href="/privacy"
                  className="ml-1 hover:text-black"
                >
                  隐私政策
                </a>{' '}
                ｜
                <a
                  href="/data-controls"
                  className="ml-1 hover:text-black"
                >
                  数据控制
                </a>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-7">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="text-sm font-semibold text-black/55">{group.title}</h4>
                  <ul className="mt-4 space-y-2.5">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-xs text-black/72 transition-colors hover:text-black sm:text-sm"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-9 text-center text-xs text-black/38">开发者 Ocean</p>
        </div>
      </footer>
    </div>
  );
}
