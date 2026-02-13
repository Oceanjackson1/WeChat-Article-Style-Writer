import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '文脉 AI｜上传历史文章，生成同风格公众号标题与正文',
  description:
    '面向微信公众号内容团队：支持上传 PDF/TXT/DOCX 建立风格库，自动生成风格画像，按提纲与核心观点生成标题和正文，支持字数控制与历史记录管理。',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  keywords: [
    '公众号写作',
    '微信公众号写作助手',
    'AI写作助手',
    '风格学习',
    '公众号标题生成',
    '提纲生成正文',
    '字数控制',
    '风格画像',
    '内容创作工具',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-[hsl(var(--background))]">
        {children}
      </body>
    </html>
  );
}
