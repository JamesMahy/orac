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
export class SessionAuthGuard implements CanActivate {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.cookieOptions = cookieOptions(configService);
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const token = request.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload;
    try {
      payload = this.authService.verifyToken(token);
    } catch {
      throw new UnauthorizedException();
    }

    const freshToken = this.authService.extendToken(payload);
    response.cookie(COOKIE_NAME, freshToken, this.cookieOptions);

    return true;
  }
}
