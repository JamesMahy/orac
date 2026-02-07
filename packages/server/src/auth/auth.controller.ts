import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@ApiBasicAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('auth')
export class AuthController {
  @Get('login')
  @ApiOperation({ summary: 'Validate credentials and log in' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(): { authenticated: boolean } {
    return { authenticated: true };
  }
}
