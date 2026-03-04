export type VaultAdapterField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  secure?: boolean;
  default?: string;
};

export type VaultAdapterDefinition = {
  vaultAdapterId: string;
  name: string;
  fields: VaultAdapterField[];
};

export abstract class VaultAdapter {
  abstract readonly vaultAdapterId: string;
  abstract readonly name: string;
  abstract readonly fields: VaultAdapterField[];

  abstract upload(
    connection: unknown,
    key: string,
    data: Buffer,
    mimeType: string,
  ): Promise<void>;

  abstract download(connection: unknown, key: string): Promise<Buffer>;

  abstract delete(connection: unknown, key: string): Promise<void>;

  abstract exists(connection: unknown, key: string): Promise<boolean>;

  toDefinition(): VaultAdapterDefinition {
    return {
      vaultAdapterId: this.vaultAdapterId,
      name: this.name,
      fields: this.fields,
    };
  }
}
