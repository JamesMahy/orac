import { Module } from '@nestjs/common';
import { AdaptersModule } from '@adapters/adapters.module';
import { ClankersController } from './clankers.controller';
import { ClankersService } from './clankers.service';

@Module({
  imports: [AdaptersModule],
  controllers: [ClankersController],
  providers: [ClankersService],
  exports: [ClankersService],
})
export class ClankersModule {}
