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

  @Get(':id/status')
  @SshDocs.getStatus
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return { hostId: id, ...this.sshService.getStatus(id) };
  }

  @Get(':id/browse')
  @SshDocs.browse
  browse(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BrowseQueryDto,
  ) {
    return this.sshService.browse(id, query.path);
  }
}
