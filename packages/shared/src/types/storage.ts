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

export type Vault = {
  vaultId: string;
  name: string;
  vaultAdapterId: string;
  config: Record<string, unknown>; // secure fields masked as true
  createdAt: Date;
  updatedAt: Date;
};

export type CreateVaultDto = {
  name: string;
  vaultAdapterId: string;
  config?: Record<string, unknown>;
};

export type UpdateVaultDto = {
  name?: string;
  config?: Record<string, unknown>;
};
