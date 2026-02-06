import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBasicAuth, ApiResponse } from '@nestjs/swagger';
import { HostsService } from './hosts.service';
import { CreateHostDto, UpdateHostDto } from './hosts.dto';
import { HostsDocs } from './hosts.docs';

@ApiTags('Hosts')
@ApiBasicAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  @Get()
  @HostsDocs.findAll
  findAll() {
    return this.hostsService.findAll();
  }

  @Get(':id')
  @HostsDocs.findOne
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.hostsService.findOne(id);
  }

  @Post()
  @HostsDocs.create
  create(@Body() dto: CreateHostDto) {
    return this.hostsService.create(dto);
  }

  @Patch(':id')
  @HostsDocs.update
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHostDto) {
    return this.hostsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @HostsDocs.remove
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.hostsService.remove(id);
  }
}
