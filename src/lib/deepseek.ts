/**
 * DeepSeek 原生 API 封装（仅服务端使用）
 * 统一 chat completion 接口，不暴露 API Key 到浏览器
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

export type DeepSeekMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface DeepSeekChatOptions {
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface DeepSeekChatResponse {
  id?: string;
  choices?: Array<{
    message?: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function deepseekChat(options: DeepSeekChatOptions): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const body = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4096,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[DeepSeek] API error:', res.status, text);
    throw new Error(`DeepSeek API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as DeepSeekChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (content == null) {
    console.error('[DeepSeek] No content in response:', data);
    throw new Error('DeepSeek returned no content');
  }
  return content;
}
