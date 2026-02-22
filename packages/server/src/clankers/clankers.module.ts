import { Module } from '@nestjs/common';
import { ClankerAdaptersModule } from '@clankerAdapters/clankerAdapters.module';
import { ClankersController } from './clankers.controller';
import { ClankersService } from './clankers.service';

@Module({
  imports: [ClankerAdaptersModule],
  controllers: [ClankersController],
  providers: [ClankersService],
  exports: [ClankersService],
})
export class ClankersModule {}
