import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { CookieOptions, Request, Response } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';
import { COOKIE_NAME, cookieOptions } from '../../auth/auth.constants';

@Injectable()
export class UserContextGuard implements CanActivate {
  private readonly authMode: string;
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.authMode = configService.getOrThrow<string>('AUTH_MODE');
    this.cookieOptions = cookieOptions(configService);
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    if (this.authMode === 'multi') {
      const token = request.cookies?.[COOKIE_NAME] as string | undefined;
      if (token) {
        const response = context.switchToHttp().getResponse<Response>();
        const payload = this.authService.verifyToken(token);
        const freshToken = this.authService.extendToken(payload);

        response.cookie(COOKIE_NAME, freshToken, this.cookieOptions);
      }
    }

    return true;
  }
}
