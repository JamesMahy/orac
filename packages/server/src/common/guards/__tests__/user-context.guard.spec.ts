import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserContextGuard } from '../user-context.guard';
import { AuthService } from '../../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { COOKIE_NAME } from '../../../auth/auth.constants';

function buildGuard(authMode: string) {
  const reflector = { getAllAndOverride: jest.fn() };
  const authService = {
    verifyToken: jest.fn(),
    extendToken: jest.fn().mockReturnValue('extended-token'),
  };
  const configService = {
    getOrThrow: (key: string) =>
      ({ AUTH_MODE: authMode, SESSION_TIMEOUT_MINUTES: '15' })[key] ?? '',
    get: (key: string, fallback?: string) =>
      ({ NODE_ENV: 'test' })[key] ?? fallback,
  };
  const guard = new UserContextGuard(
    reflector as unknown as Reflector,
    authService as unknown as AuthService,
    configService as unknown as ConfigService,
  );
  return { guard, reflector, authService };
}

function buildContext({
  user,
  cookies = {},
}: {
  user?: { userId: string; sub?: string };
  cookies?: Record<string, string>;
}): { context: ExecutionContext; mockCookie: jest.Mock } {
  const mockCookie = jest.fn();
  const handler = () => {};
  const controller = class {};
  const context = {
    getHandler: jest.fn().mockReturnValue(handler),
    getClass: jest.fn().mockReturnValue(controller),
    switchToHttp: () => ({
      getRequest: (): Partial<Request> => ({ user, cookies }),
      getResponse: (): Partial<Response> => ({ cookie: mockCookie } as unknown as Partial<Response>),
    }),
  } as unknown as ExecutionContext;

  return { context, mockCookie };
}

describe('UserContextGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if AUTH_MODE is an invalid value', () => {
      expect(() => buildGuard('invalid')).toThrow(
        "AUTH_MODE must be explicitly set to 'single' or 'multi'",
      );
    });

    it('should throw if AUTH_MODE is an empty string', () => {
      expect(() => buildGuard('')).toThrow(
        "AUTH_MODE must be explicitly set to 'single' or 'multi'",
      );
    });

    it('should not throw for AUTH_MODE=single', () => {
      expect(() => buildGuard('single')).not.toThrow();
    });

    it('should not throw for AUTH_MODE=multi', () => {
      expect(() => buildGuard('multi')).not.toThrow();
    });

    it('should accept AUTH_MODE with surrounding whitespace', () => {
      expect(() => buildGuard('  single  ')).not.toThrow();
    });

    it('should accept AUTH_MODE in uppercase', () => {
      expect(() => buildGuard('MULTI')).not.toThrow();
    });
  });

  describe('public routes', () => {
    it('should allow access without req.user on a public route', () => {
      const { guard, reflector } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(true);
      const { context } = buildContext({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should check IS_PUBLIC_KEY on handler and class', () => {
      const { guard, reflector } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(true);
      const { context } = buildContext({});

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.arrayContaining([expect.anything(), expect.anything()]),
      );
    });
  });

  describe('protected routes', () => {
    it('should allow access when req.user is set', () => {
      const { guard, reflector } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context } = buildContext({ user: { userId: 'admin' } });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException when req.user is not set', () => {
      const { guard, reflector } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context } = buildContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw with auth_required code when req.user is not set', () => {
      const { guard, reflector } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context } = buildContext({});

      expect(() => guard.canActivate(context)).toThrow('auth_required');
    });
  });

  describe('token extension (multi mode)', () => {
    it('should extend the JWT cookie on authenticated requests', () => {
      const { guard, reflector, authService } = buildGuard('multi');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context, mockCookie } = buildContext({
        user: { userId: 'user-123', sub: 'testuser' },
        cookies: { [COOKIE_NAME]: 'existing-token' },
      });

      guard.canActivate(context);

      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(authService.extendToken).toHaveBeenCalledWith({ userId: 'user-123', sub: 'testuser' });
      expect(mockCookie).toHaveBeenCalledWith(
        COOKIE_NAME,
        'extended-token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
      );
    });

    it('should fall back to userId as sub when sub is absent on req.user', () => {
      const { guard, reflector, authService } = buildGuard('multi');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context } = buildContext({
        user: { userId: 'user-123' },
        cookies: { [COOKIE_NAME]: 'existing-token' },
      });

      guard.canActivate(context);

      expect(authService.extendToken).toHaveBeenCalledWith({
        userId: 'user-123',
        sub: 'user-123',
      });
    });

    it('should not extend the token when no cookie is present', () => {
      const { guard, reflector, authService } = buildGuard('multi');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context, mockCookie } = buildContext({ user: { userId: 'user-123' } });

      guard.canActivate(context);

      expect(authService.extendToken).not.toHaveBeenCalled();
      expect(mockCookie).not.toHaveBeenCalled();
    });

  });

  describe('single mode', () => {
    it('should not extend the token in single mode', () => {
      const { guard, reflector, authService } = buildGuard('single');
      reflector.getAllAndOverride.mockReturnValue(false);
      const { context, mockCookie } = buildContext({
        user: { userId: 'admin' },
        cookies: { [COOKIE_NAME]: 'some-token' },
      });

      guard.canActivate(context);

      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(authService.extendToken).not.toHaveBeenCalled();
      expect(mockCookie).not.toHaveBeenCalled();
    });
  });
});
