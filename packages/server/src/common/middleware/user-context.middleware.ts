import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../auth/auth.service';
import { COOKIE_NAME } from '../../auth/auth.constants';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  private readonly authMode: 'single' | 'multi';

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    const raw = configService.getOrThrow<string>('AUTH_MODE').trim().toLowerCase();

    if (raw !== 'single' && raw !== 'multi') {
      throw new Error(
        `AUTH_MODE must be explicitly set to 'single' or 'multi'. Got: ${JSON.stringify(raw)}`,
      );
    }

    this.authMode = raw;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    if (this.authMode === 'single') {
      req.user = { userId: 'admin' };
      return next();
    }

    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (token) {
      try {
        const payload = this.authService.verifyToken(token);
        req.user = { userId: payload.userId };
      } catch {
        // invalid token — leave req.user unset, guard will throw 401
      }
    }

    return next();
  }
}
