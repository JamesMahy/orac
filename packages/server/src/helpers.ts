export function shellEscape(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeObject(
  object: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(object)) {
    if (!DANGEROUS_KEYS.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
