import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { ClankerAdaptersService } from './clankerAdapters.service';
import { ClankerAdaptersDocs } from './clankerAdapters.docs';

@ApiTags('Clanker Adapters')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('clanker-adapters')
export class ClankerAdaptersController {
  constructor(private readonly clankerAdaptersService: ClankerAdaptersService) {}

  @Get()
  @ClankerAdaptersDocs.findAll
  findAll() {
    return this.clankerAdaptersService.findAll();
  }

  @Get(':clankerAdapterId')
  @ClankerAdaptersDocs.findOne
  findOne(@Param('clankerAdapterId') clankerAdapterId: string) {
    return this.clankerAdaptersService.findOne(clankerAdapterId);
  }
}
