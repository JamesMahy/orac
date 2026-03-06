import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { extractUserId } from '../user-id.decorator';

function buildContext(user?: { userId: string }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: (): Partial<Request> => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('extractUserId', () => {
  it('should return userId when req.user is set', () => {
    const context = buildContext({ userId: 'user-abc-123' });

    expect(extractUserId(undefined, context)).toBe('user-abc-123');
  });

  it('should throw UnauthorizedException when req.user is undefined', () => {
    const context = buildContext(undefined);

    expect(() => extractUserId(undefined, context)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw with auth_required code when req.user is undefined', () => {
    const context = buildContext(undefined);

    expect(() => extractUserId(undefined, context)).toThrow('auth_required');
  });

  it('should throw UnauthorizedException when userId is an empty string', () => {
    const context = buildContext({ userId: '' });

    expect(() => extractUserId(undefined, context)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw with auth_required code when userId is an empty string', () => {
    const context = buildContext({ userId: '' });

    expect(() => extractUserId(undefined, context)).toThrow('auth_required');
  });
});
