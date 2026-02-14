import type { DeepSeekMessage } from '@/lib/deepseek';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_APP_NAME = 'Wenmai AI';

export interface OpenRouterChatOptions {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
}

type OpenRouterMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: OpenRouterMessageContent;
    };
  }>;
}

function normalizeContent(content: OpenRouterMessageContent | undefined): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function toSafeHeaderValue(input: string | undefined, fallback: string): string {
  const normalized = String(input || '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
  return normalized || fallback;
}

export async function openrouterChat(options: OpenRouterChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;
  const referer = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const title = toSafeHeaderValue(process.env.OPENROUTER_APP_NAME, DEFAULT_APP_NAME);

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': toSafeHeaderValue(referer, 'http://localhost:3000'),
      'X-Title': title,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[OpenRouter] API error:', res.status, text);
    throw new Error(`OpenRouter API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as OpenRouterChatResponse;
  const content = normalizeContent(data.choices?.[0]?.message?.content);
  if (!content) {
    console.error('[OpenRouter] No content in response:', data);
    throw new Error('OpenRouter returned no content');
  }
  return content;
}
