import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdapterDefinition } from '@orac/shared';
import { BaseClankerAdapter } from '@clankerAdapters/base';
import { ClaudeCodeAdapter } from '@clankerAdapters/implementations';

@Injectable()
export class ClankerAdaptersService {
  private readonly adapters: Map<string, BaseClankerAdapter>;

  constructor() {
    const registered: BaseClankerAdapter[] = [new ClaudeCodeAdapter()];
    this.adapters = new Map(
      registered.map(adapter => [adapter.clankerAdapterId, adapter]),
    );
  }

  findAll(): AdapterDefinition[] {
    return Array.from(this.adapters.values()).map(adapter =>
      adapter.toDefinition(),
    );
  }

  findOne(clankerAdapterId: string): AdapterDefinition {
    const adapter = this.adapters.get(clankerAdapterId);
    if (!adapter) {
      throw new NotFoundException('adapter_not_found');
    }
    return adapter.toDefinition();
  }

  getAdapter(clankerAdapterId: string): BaseClankerAdapter {
    const adapter = this.adapters.get(clankerAdapterId);
    if (!adapter) {
      throw new NotFoundException('adapter_not_found');
    }
    return adapter;
  }
}
