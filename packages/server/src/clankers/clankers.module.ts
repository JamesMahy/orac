import { Module } from '@nestjs/common';
import { ClankerAdaptersController } from './clankerAdapters.controller';
import { ClankerAdaptersService } from './clankerAdapters.service';
import { ClankersController } from './clankers.controller';
import { ClankersService } from './clankers.service';

@Module({
  controllers: [ClankerAdaptersController, ClankersController],
  providers: [ClankerAdaptersService, ClankersService],
  exports: [ClankersService, ClankerAdaptersService],
})
export class ClankersModule {}
