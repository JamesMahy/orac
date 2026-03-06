import { randomUUID, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type JwtPayload = {
  sub: string;
  userId: string;
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
    const usernameMatch = this.safeEqual(username, this.expectedUser);
    const passwordMatch = this.safeEqual(password, this.expectedPass);
    return usernameMatch && passwordMatch;
  }

  login(username: string, password: string): string {
    if (!this.validateCredentials(username, password)) {
      throw new UnauthorizedException('invalid_credentials');
    }

    return this.jwtService.sign({
      sub: username,
      userId: 'admin',
      jti: randomUUID(),
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  extendToken(identity: { userId: string; sub: string }): string {
    return this.jwtService.sign({
      sub: identity.sub,
      userId: identity.userId,
      jti: randomUUID(),
    });
  }

  private safeEqual(a: string, b: string): boolean {
    // Fixed-length buffers prevent length-based timing side-channels.
    // Inputs longer than 256 UTF-8 bytes are silently truncated — intentional,
    // as env-var credentials will never approach this limit in practice.
    const fixedLength = 256;
    const bufA = Buffer.alloc(fixedLength);
    const bufB = Buffer.alloc(fixedLength);
    Buffer.from(a, 'utf8').copy(bufA, 0, 0, fixedLength);
    Buffer.from(b, 'utf8').copy(bufB, 0, 0, fixedLength);
    return timingSafeEqual(bufA, bufB);
  }
}
