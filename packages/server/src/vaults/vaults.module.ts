import { Module } from '@nestjs/common';
import { WorkspacesModule } from '@workspaces/workspaces.module';
import { VaultAdaptersService } from './vaultAdapters.service';
import { VaultsService } from './vaults.service';
import { VaultsController } from './vaults.controller';

@Module({
  imports: [WorkspacesModule],
  controllers: [VaultsController],
  providers: [VaultAdaptersService, VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}
