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

function extractApiErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    const msg = parsed?.error?.message || parsed?.message;
    return String(msg || raw || '').trim();
  } catch {
    return String(raw || '').trim();
  }
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

function looksLikeHeaderIssue(message: string): boolean {
  return /header|referer|x-title|bytestring|invalid character|invalid header/i.test(message);
}

function resolveOpenRouterApiKey(): { apiKey: string | null; source: string | null } {
  const candidates: Array<{ name: string; value: string | undefined }> = [
    { name: 'OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY },
    { name: 'OPEN_ROUTER_API', value: process.env.OPEN_ROUTER_API },
    { name: 'Open_Router_API', value: process.env['Open_Router_API'] },
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate.value || '').trim();
    if (normalized) {
      return { apiKey: normalized, source: candidate.name };
    }
  }

  return { apiKey: null, source: null };
}

export async function openrouterChat(options: OpenRouterChatOptions): Promise<string> {
  const { apiKey, source } = resolveOpenRouterApiKey();
  const baseUrl = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;
  const referer = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const title = toSafeHeaderValue(process.env.OPENROUTER_APP_NAME, DEFAULT_APP_NAME);

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set (checked: OPENROUTER_API_KEY, OPEN_ROUTER_API, Open_Router_API)'
    );
  }

  if (source !== 'OPENROUTER_API_KEY') {
    console.warn(`[OpenRouter] Using legacy env var "${source}". Please migrate to OPENROUTER_API_KEY.`);
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = JSON.stringify({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4096,
  });
  const baseHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const optionalHeaders = {
    'HTTP-Referer': toSafeHeaderValue(referer, 'http://localhost:3000'),
    'X-Title': title,
  };

  const request = async (
    headers: Record<string, string>
  ): Promise<{ ok: boolean; status: number; text: string }> => {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  };

  let response = await request({ ...baseHeaders, ...optionalHeaders });

  if (!response.ok && looksLikeHeaderIssue(response.text)) {
    response = await request(baseHeaders);
  }

  if (!response.ok) {
    const parsedMessage = extractApiErrorMessage(response.text).slice(0, 500);
    console.error('[OpenRouter] API error:', response.status, parsedMessage);
    throw new Error(`OpenRouter API ${response.status}: ${parsedMessage}`);
  }

  const data = JSON.parse(response.text) as OpenRouterChatResponse;
  const content = normalizeContent(data.choices?.[0]?.message?.content);
  if (!content) {
    console.error('[OpenRouter] No content in response:', data);
    throw new Error('OpenRouter returned no content');
  }
  return content;
}
