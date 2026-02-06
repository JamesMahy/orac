import { timingSafeEqual } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly expectedUser: string;
  private readonly expectedPass: string;

  constructor(configService: ConfigService) {
    this.expectedUser = configService.getOrThrow<string>('BASIC_AUTH_USER');
    this.expectedPass = configService.getOrThrow<string>('BASIC_AUTH_PASS');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Basic ')) {
      throw new UnauthorizedException();
    }

    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      throw new UnauthorizedException();
    }

    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);

    if (
      !this.safeEqual(user, this.expectedUser) ||
      !this.safeEqual(pass, this.expectedPass)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
