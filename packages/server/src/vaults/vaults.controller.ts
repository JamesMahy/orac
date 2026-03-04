import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { VaultAdaptersService } from './vaultAdapters.service';
import { VaultsService } from './vaults.service';
import { VaultsDocs } from './vaults.docs';

@ApiTags('Vaults')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller()
export class VaultsController {
  constructor(
    private readonly vaultAdapters: VaultAdaptersService,
    private readonly vaults: VaultsService,
  ) {}

  @Get('vault-adapters')
  @VaultsDocs.findAllAdapters
  findAllAdapters() {
    return this.vaultAdapters.findAll();
  }

  @Get('vaults')
  @VaultsDocs.findAllVaults
  findAllVaults() {
    return this.vaults.findAll();
  }
}
