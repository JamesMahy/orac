import { Injectable, NotFoundException } from '@nestjs/common';
import { VaultAdapter } from '@vaults/base';
import type { VaultAdapterDefinition } from '@vaults/base';
import { S3VaultAdapter } from '@vaults/implementations';

@Injectable()
export class VaultAdaptersService {
  private readonly adapters: Map<string, VaultAdapter>;

  constructor() {
    const registered: VaultAdapter[] = [new S3VaultAdapter()];
    this.adapters = new Map(
      registered.map(adapter => [adapter.vaultAdapterId, adapter]),
    );
  }

  findAll(): VaultAdapterDefinition[] {
    return Array.from(this.adapters.values()).map(adapter =>
      adapter.toDefinition(),
    );
  }

  findOne(vaultAdapterId: string): VaultAdapterDefinition {
    const adapter = this.adapters.get(vaultAdapterId);
    if (!adapter) {
      throw new NotFoundException('vault_adapter_not_found');
    }
    return adapter.toDefinition();
  }

  getAdapter(vaultAdapterId: string): VaultAdapter {
    const adapter = this.adapters.get(vaultAdapterId);
    if (!adapter) {
      throw new NotFoundException('vault_adapter_not_found');
    }
    return adapter;
  }
}
