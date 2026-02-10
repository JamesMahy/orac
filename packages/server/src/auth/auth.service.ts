import { randomUUID, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type JwtPayload = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AuthService {
  private readonly expectedUser: string;
  private readonly expectedPass: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.expectedUser = configService.getOrThrow<string>('BASIC_AUTH_USER');
    this.expectedPass = configService.getOrThrow<string>('BASIC_AUTH_PASS');
  }

  validateCredentials(username: string, password: string): boolean {
    return (
      this.safeEqual(username, this.expectedUser) &&
      this.safeEqual(password, this.expectedPass)
    );
  }

  login(username: string, password: string): string {
    if (!this.validateCredentials(username, password)) {
      throw new UnauthorizedException('invalid_credentials');
    }

    return this.jwtService.sign({
      sub: username,
      jti: randomUUID(),
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  extendToken(payload: JwtPayload): string {
    return this.jwtService.sign({
      sub: payload.sub,
      jti: randomUUID(),
    });
  }

  private safeEqual(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
      timingSafeEqual(bufferA, bufferA);
      return false;
    }
    return timingSafeEqual(bufferA, bufferB);
  }
}
