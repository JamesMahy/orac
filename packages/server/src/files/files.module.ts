import { Module } from '@nestjs/common';
import { VaultsModule } from '@vaults/vaults.module';
import { FileService } from './file.service';

@Module({
  imports: [VaultsModule],
  providers: [FileService],
  exports: [FileService],
})
export class FilesModule {}
