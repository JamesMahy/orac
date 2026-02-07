import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto, LoginDto } from './auth.dto';

export const AuthDocs = {
  login: applyDecorators(
    ApiOperation({ summary: 'Log in with credentials' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      type: AuthResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  ),

  logout: applyDecorators(
    ApiOperation({ summary: 'Log out and invalidate session' }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      type: AuthResponseDto,
    }),
  ),

  checkSession: applyDecorators(
    ApiOperation({ summary: 'Check if current session is valid' }),
    ApiResponse({
      status: 200,
      description: 'Session status',
      type: AuthResponseDto,
    }),
  ),
};
