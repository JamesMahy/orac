import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto } from './auth.dto';
import { AuthDocs } from './auth.docs';
import { COOKIE_NAME, cookieOptions } from './auth.constants';

@ApiTags('Auth')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('auth')
export class AuthController {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.cookieOptions = cookieOptions(configService);
  }

  @Post('login')
  @Public()
  @AuthDocs.login
  login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): AuthResponseDto {
    const token = this.authService.login(loginDto.username, loginDto.password);
    response.cookie(COOKIE_NAME, token, this.cookieOptions);

    return { authenticated: true };
  }

  @Post('logout')
  @Public()
  @AuthDocs.logout
  logout(
    @Res({ passthrough: true }) response: Response,
  ): AuthResponseDto {
    response.clearCookie(COOKIE_NAME, {
      httpOnly: this.cookieOptions.httpOnly,
      secure: this.cookieOptions.secure,
      sameSite: this.cookieOptions.sameSite,
      path: this.cookieOptions.path,
    });

    return { authenticated: false };
  }

  @Get('session')
  @Public()
  @AuthDocs.checkSession
  checkSession(@Req() request: Request): AuthResponseDto {
    const token = request.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) {
      return { authenticated: false };
    }

    try {
      this.authService.verifyToken(token);
      return { authenticated: true };
    } catch {
      return { authenticated: false };
    }
  }
}
