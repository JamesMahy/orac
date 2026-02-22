import { Module } from '@nestjs/common';
import { ClankerAdaptersController } from './clankerAdapters.controller';
import { ClankerAdaptersService } from './clankerAdapters.service';

@Module({
  controllers: [ClankerAdaptersController],
  providers: [ClankerAdaptersService],
  exports: [ClankerAdaptersService],
})
export class ClankerAdaptersModule {}
