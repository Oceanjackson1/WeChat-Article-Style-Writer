import { NextResponse } from 'next/server';

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } as ApiSuccess<T>, { status });
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } } as ApiError,
    { status }
  );
}

export function apiUnauthorized(message = '未登录') {
  return apiError('UNAUTHORIZED', message, 401);
}
