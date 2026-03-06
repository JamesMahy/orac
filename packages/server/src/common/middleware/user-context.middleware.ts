import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../auth/auth.service';
import { COOKIE_NAME, resolveAuthMode } from '../../auth/auth.constants';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  private readonly authMode: 'single' | 'multi';

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.authMode = resolveAuthMode(configService);
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
        req.user = { userId: payload.userId, sub: payload.sub };
      } catch {
        // invalid token — leave req.user unset, guard will throw 401
      }
    }

    return next();
  }
}
