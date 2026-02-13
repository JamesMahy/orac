import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { AdaptersService } from './adapters.service';
import { AdaptersDocs } from './adapters.docs';

@ApiTags('Adapters')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('adapters')
export class AdaptersController {
  constructor(private readonly adaptersService: AdaptersService) {}

  @Get()
  @AdaptersDocs.findAll
  findAll() {
    return this.adaptersService.findAll();
  }

  @Get(':id')
  @AdaptersDocs.findOne
  findOne(@Param('id') id: string) {
    return this.adaptersService.findOne(id);
  }
}
