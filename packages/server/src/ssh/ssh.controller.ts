import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { SshService } from './ssh.service';
import { TestConnectionDto, BrowseQueryDto } from './ssh.dto';
import { SshDocs } from './ssh.docs';

@ApiTags('SSH')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('hosts')
export class SshController {
  constructor(private readonly sshService: SshService) {}

  @Post('test-connection')
  @SshDocs.testConnection
  testConnection(@Body() testConnectionDto: TestConnectionDto) {
    return this.sshService.testConnection(testConnectionDto);
  }

  @Get(':hostId/status')
  @SshDocs.getStatus
  getStatus(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return { hostId, ...this.sshService.getStatus(hostId) };
  }

  @Get(':hostId/browse')
  @SshDocs.browse
  browse(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @Query() query: BrowseQueryDto,
  ) {
    return this.sshService.browse(hostId, query.path);
  }
}
