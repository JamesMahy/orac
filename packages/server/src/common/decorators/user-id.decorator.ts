import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export function extractUserId(_data: unknown, ctx: ExecutionContext): string {
  const request = ctx.switchToHttp().getRequest<Request>();
  const userId = request.user?.userId;

  if (!userId) throw new UnauthorizedException('auth_required');
  return userId;
}

export const UserId = createParamDecorator(extractUserId);
