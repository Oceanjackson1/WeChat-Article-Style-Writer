'use client';

import { useState } from 'react';
import type { GenerationResult } from '@/app/dashboard/page';

export default function OutputCard({ result }: { result: GenerationResult | null }) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
        <h2 className="text-base font-semibold text-neutral-900 mb-3">输出</h2>
        <p className="text-sm text-neutral-500">生成后将在此显示标题与正文</p>
      </section>
    );
  }

  const fullText = `${result.title}\n\n${result.article}`;

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const deviation = result.deviation_percent ?? 0;
  const inRange = Math.abs(deviation) <= 10;

  return (
    <section className="rounded-apple-lg border border-[hsl(var(--border))] bg-white p-6 shadow-apple">
      <h2 className="text-base font-semibold text-neutral-900 mb-3">输出</h2>

      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="text-sm text-neutral-600">
          字数：{result.article_char_count}（目标 {result.target_length}
          {deviation !== 0 && (
            <span className={inRange ? 'text-green-600' : 'text-amber-600'}>
              {' '}
              {deviation > 0 ? '+' : ''}{deviation}%
            </span>
          )}
          ）
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          {copied ? '已复制' : '复制全文'}
        </button>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mt-4 mb-2">{result.title}</h3>
      <div className="rounded-apple border border-neutral-200 bg-neutral-50/50 p-4 text-sm text-neutral-700 whitespace-pre-wrap">
        {result.article}
      </div>
    </section>
  );
}
