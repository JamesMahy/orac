import { UnauthorizedException } from '@nestjs/common';
import { BasicAuthGuard } from './basic-auth.guard';

function encode(user: string, pass: string): string {
  return Buffer.from(`${user}:${pass}`).toString('base64');
}

function createContext(authHeader?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: authHeader,
        },
      }),
    }),
  } as unknown as import('@nestjs/common').ExecutionContext;
}

describe('BasicAuthGuard', () => {
  let guard: BasicAuthGuard;

  beforeEach(() => {
    const configService = {
      getOrThrow: (key: string) => {
        const values: Record<string, string> = {
          BASIC_AUTH_USER: 'admin',
          BASIC_AUTH_PASS: 'secret',
        };
        return values[key];
      },
    };
    guard = new BasicAuthGuard(
      configService as unknown as import('@nestjs/config').ConfigService,
    );
  });

  it('should allow valid credentials', () => {
    const ctx = createContext(`Basic ${encode('admin', 'secret')}`);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject missing authorization header', () => {
    const ctx = createContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject non-Basic scheme', () => {
    const ctx = createContext('Bearer some-token');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject wrong username', () => {
    const ctx = createContext(`Basic ${encode('wrong', 'secret')}`);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject wrong password', () => {
    const ctx = createContext(`Basic ${encode('admin', 'wrong')}`);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject malformed base64 (no colon separator)', () => {
    const encoded = Buffer.from('no-colon-here').toString('base64');
    const ctx = createContext(`Basic ${encoded}`);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should handle password containing colon', () => {
    const configService = {
      getOrThrow: (key: string) => {
        const values: Record<string, string> = {
          BASIC_AUTH_USER: 'admin',
          BASIC_AUTH_PASS: 'pass:with:colons',
        };
        return values[key];
      },
    };
    const colonGuard = new BasicAuthGuard(
      configService as unknown as import('@nestjs/config').ConfigService,
    );
    const ctx = createContext(`Basic ${encode('admin', 'pass:with:colons')}`);
    expect(colonGuard.canActivate(ctx)).toBe(true);
  });
});
