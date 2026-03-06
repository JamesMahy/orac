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
import { UserId } from '@common/decorators/user-id.decorator';
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

  @Get(':clankerId')
  @ClankersDocs.findOne
  findOne(@Param('clankerId', ParseUUIDPipe) clankerId: string) {
    return this.clankersService.findOne(clankerId);
  }

  @Post()
  @ClankersDocs.create
  create(@UserId() userId: string, @Body() dto: CreateClankerDto) {
    return this.clankersService.create(dto, userId);
  }

  @Patch(':clankerId')
  @ClankersDocs.update
  update(
    @Param('clankerId', ParseUUIDPipe) clankerId: string,
    @Body() dto: UpdateClankerDto,
  ) {
    return this.clankersService.update(clankerId, dto);
  }

  @Delete(':clankerId')
  @HttpCode(204)
  @ClankersDocs.remove
  remove(@Param('clankerId', ParseUUIDPipe) clankerId: string) {
    return this.clankersService.remove(clankerId);
  }
}
