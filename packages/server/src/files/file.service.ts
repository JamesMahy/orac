import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { basename } from 'path';
import { VaultsService } from '@vaults/vaults.service';

@Injectable()
export class FileService {
  constructor(private readonly vaults: VaultsService) {}

  async upload(
    workspaceId: string,
    filename: string,
    data: Buffer,
    mimeType: string,
  ): Promise<string> {
    const safeName = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${workspaceId}/${randomUUID()}/${safeName}`;
    const { adapter, connection } =
      await this.vaults.getActiveVault(workspaceId);

    await adapter.upload(connection, key, data, mimeType);
    return key;
  }

  async download(storageKey: string, workspaceId: string): Promise<Buffer> {
    const { adapter, connection } =
      await this.vaults.getActiveVault(workspaceId);

    return adapter.download(connection, storageKey);
  }

  async remove(storageKey: string, workspaceId: string): Promise<void> {
    const { adapter, connection } =
      await this.vaults.getActiveVault(workspaceId);

    return adapter.delete(connection, storageKey);
  }
}
