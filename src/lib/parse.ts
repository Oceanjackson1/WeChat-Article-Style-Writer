/**
 * 服务端文件解析：PDF / DOCX / TXT
 * 解析后清洗：多余空行、不可见字符、连续空格
 */

import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('文件大小超过 10MB');
  }
  const data = await pdf(buffer);
  return cleanText(data.text || '');
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('文件大小超过 10MB');
  }
  const result = await mammoth.extractRawText({ buffer });
  return cleanText(result.value || '');
}

export function parseTxt(buffer: Buffer): string {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('文件大小超过 10MB');
  }
  const raw = buffer.toString('utf-8');
  return cleanText(raw);
}

export type SupportedMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain';

export const ALLOWED_MIMES: SupportedMime[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/** 浏览器可能对 PDF 返回 '' 或 application/x-pdf，用扩展名兜底 */
export function normalizeMime(mime: string, filename: string): SupportedMime | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (mime === 'application/pdf' || mime === 'application/x-pdf' || ext === 'pdf')
    return 'application/pdf';
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  )
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (mime === 'text/plain' || ext === 'txt') return 'text/plain';
  return null;
}

export function parseBuffer(buffer: Buffer, mime: string): Promise<string> {
  if (mime === 'application/pdf') return parsePdf(buffer);
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return parseDocx(buffer);
  if (mime === 'text/plain') return Promise.resolve(parseTxt(buffer));
  throw new Error(`不支持的文件类型: ${mime}`);
}
