import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const COOKIE_NAME = 'session';

export function cookieOptions(configService: ConfigService): CookieOptions {
  const secure = configService.get('NODE_ENV') === 'production';
  const timeoutMinutes = parseInt(
    configService.get('SESSION_TIMEOUT_MINUTES', '15'),
    10,
  );

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: timeoutMinutes * 60 * 1000,
  };
}
