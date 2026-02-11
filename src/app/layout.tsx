import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeChat Article Style Writer',
  description: '微信公众号文章输出工具',
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
