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
import { ClankersService } from './clankers.service';
import { CreateClankerDto, UpdateClankerDto } from './clankers.dto';
import { ClankersDocs } from './clankers.docs';

@ApiTags('Clankers')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('clankers')
export class ClankersController {
  constructor(private readonly clankersService: ClankersService) {}

  @Get()
  @ClankersDocs.findAll
  findAll() {
    return this.clankersService.findAll();
  }

  @Get(':id')
  @ClankersDocs.findOne
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clankersService.findOne(id);
  }

  @Post()
  @ClankersDocs.create
  create(@Body() dto: CreateClankerDto) {
    return this.clankersService.create(dto);
  }

  @Patch(':id')
  @ClankersDocs.update
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClankerDto,
  ) {
    return this.clankersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ClankersDocs.remove
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clankersService.remove(id);
  }
}
