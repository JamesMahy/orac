import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const COOKIE_NAME = 'session';

export function resolveAuthMode(
  configService: ConfigService,
): 'single' | 'multi' {
  const raw = configService
    .getOrThrow<string>('AUTH_MODE')
    .trim()
    .toLowerCase();

  if (raw !== 'single' && raw !== 'multi') {
    throw new Error(
      `AUTH_MODE must be explicitly set to 'single' or 'multi'. Got: ${JSON.stringify(raw)}`,
    );
  }
  return raw;
}

export function resolveJwtConfig(configService: ConfigService): {
  secret: string;
  timeoutMinutes: number;
} {
  const secret = configService.getOrThrow<string>('JWT_SECRET');
  if (secret.length < 32 || secret === 'change-me-to-a-random-string') {
    throw new Error(
      'JWT_SECRET is too short or is the example placeholder. Use at least 32 random characters.',
    );
  }

  const rawTimeout = configService.get<string>('SESSION_TIMEOUT_MINUTES', '15');
  const timeoutMinutes = parseInt(rawTimeout, 10);

  if (isNaN(timeoutMinutes) || timeoutMinutes < 1) {
    throw new Error(
      `SESSION_TIMEOUT_MINUTES must be a positive integer. Got: ${JSON.stringify(rawTimeout)}`,
    );
  }

  return { secret, timeoutMinutes };
}

export function cookieOptions(configService: ConfigService): CookieOptions {
  const cookieSecureEnabled = configService.get('COOKIE_SECURE') === 'true';
  const isProduction = configService.get('NODE_ENV') === 'production';
  const rawTimeout = configService.get<string>('SESSION_TIMEOUT_MINUTES', '15');

  const secure = cookieSecureEnabled || isProduction;
  const timeoutMinutes = parseInt(rawTimeout, 10);
  const resolvedTimeout = isNaN(timeoutMinutes) ? 15 : timeoutMinutes;

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: resolvedTimeout * 60 * 1000,
  };
}
