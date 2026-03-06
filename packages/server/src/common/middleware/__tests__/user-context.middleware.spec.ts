import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { UserContextMiddleware } from '../user-context.middleware';
import { AuthService } from '../../../auth/auth.service';
import { COOKIE_NAME } from '../../../auth/auth.constants';

function buildMiddleware(authMode: string) {
  const authService = { verifyToken: jest.fn() };
  const configService = {
    getOrThrow: (key: string) => ({ AUTH_MODE: authMode })[key] ?? '',
  };
  const middleware = new UserContextMiddleware(
    authService as unknown as AuthService,
    configService as unknown as ConfigService,
  );
  return { middleware, authService };
}

function mockReq(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request;
}

describe('UserContextMiddleware', () => {
  const mockRes = {} as Response;
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  describe('constructor', () => {
    it('should throw if AUTH_MODE is an invalid value', () => {
      expect(() => buildMiddleware('invalid')).toThrow(
        "AUTH_MODE must be explicitly set to 'single' or 'multi'",
      );
    });

    it('should throw if AUTH_MODE is an empty string', () => {
      expect(() => buildMiddleware('')).toThrow(
        "AUTH_MODE must be explicitly set to 'single' or 'multi'",
      );
    });

    it('should not throw for AUTH_MODE=single', () => {
      expect(() => buildMiddleware('single')).not.toThrow();
    });

    it('should not throw for AUTH_MODE=multi', () => {
      expect(() => buildMiddleware('multi')).not.toThrow();
    });

    it('should accept AUTH_MODE with surrounding whitespace', () => {
      expect(() => buildMiddleware('  single  ')).not.toThrow();
    });

    it('should accept AUTH_MODE in uppercase', () => {
      expect(() => buildMiddleware('MULTI')).not.toThrow();
    });
  });

  describe('single mode', () => {
    it('should set req.user to admin and call next', () => {
      const { middleware } = buildMiddleware('single');
      const req = mockReq();

      middleware.use(req, mockRes, next as NextFunction);

      expect(req.user).toEqual({ userId: 'admin' });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should not call verifyToken even when a cookie is present', () => {
      const { middleware, authService } = buildMiddleware('single');
      const req = mockReq({ [COOKIE_NAME]: 'some-token' });

      middleware.use(req, mockRes, next as NextFunction);

      expect(authService.verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('multi mode', () => {
    it('should set req.user from a valid JWT cookie', () => {
      const { middleware, authService } = buildMiddleware('multi');
      authService.verifyToken.mockReturnValue({ userId: 'user-123', sub: 'testuser' });
      const req = mockReq({ [COOKIE_NAME]: 'valid-token' });

      middleware.use(req, mockRes, next as NextFunction);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({ userId: 'user-123', sub: 'testuser' });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should leave req.user unset when the token is invalid', () => {
      const { middleware, authService } = buildMiddleware('multi');
      authService.verifyToken.mockImplementation(() => {
        throw new Error('invalid token');
      });
      const req = mockReq({ [COOKIE_NAME]: 'bad-token' });

      middleware.use(req, mockRes, next as NextFunction);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should leave req.user unset when no cookie is present', () => {
      const { middleware } = buildMiddleware('multi');
      const req = mockReq();

      middleware.use(req, mockRes, next as NextFunction);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
