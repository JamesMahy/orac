import type { TFunction } from 'i18next';

export function extractErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'errors' in error) {
    const codes = (error as { errors: string[] }).errors;
    if (codes.length > 0) return codes[0];
  }
  if (error instanceof Error) return error.message;
  return 'unknown_error';
}

export function translateError(
  code: string | null | undefined,
  t: TFunction,
): string | undefined {
  if (!code) return undefined;
  const key = `error-${code}`;
  const result = t(key);
  if (result === key) return undefined;
  return result;
}
