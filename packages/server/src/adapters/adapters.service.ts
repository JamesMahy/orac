import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdapterDefinition } from '@orac/shared';
import { BaseAdapter } from '@adapters/base';
import { ClaudeCodeAdapter } from '@adapters/implementations';

@Injectable()
export class AdaptersService {
  private readonly adapters: Map<string, BaseAdapter>;

  constructor() {
    const registered: BaseAdapter[] = [new ClaudeCodeAdapter()];
    this.adapters = new Map(registered.map(adapter => [adapter.id, adapter]));
  }

  findAll(): AdapterDefinition[] {
    return Array.from(this.adapters.values()).map(adapter =>
      adapter.toDefinition(),
    );
  }

  findOne(id: string): AdapterDefinition {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new NotFoundException('adapter_not_found');
    }
    return adapter.toDefinition();
  }

  getAdapter(id: string): BaseAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new NotFoundException('adapter_not_found');
    }
    return adapter;
  }
}
