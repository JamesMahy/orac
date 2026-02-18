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
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { HostsService } from './hosts.service';
import { CreateHostDto, UpdateHostDto } from './hosts.dto';
import { HostsDocs } from './hosts.docs';

@ApiTags('Hosts')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  @Get()
  @HostsDocs.findAll
  findAll() {
    return this.hostsService.findAll();
  }

  @Get(':hostId')
  @HostsDocs.findOne
  findOne(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.hostsService.findOne(hostId);
  }

  @Post()
  @HostsDocs.create
  create(@Body() dto: CreateHostDto) {
    return this.hostsService.create(dto);
  }

  @Patch(':hostId')
  @HostsDocs.update
  update(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @Body() dto: UpdateHostDto,
  ) {
    return this.hostsService.update(hostId, dto);
  }

  @Delete(':hostId')
  @HttpCode(204)
  @HostsDocs.remove
  remove(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.hostsService.remove(hostId);
  }
}
