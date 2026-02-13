export type Clanker = {
  id: string;
  name: string;
  adapterId: string;
  hostId: string | null;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateClankerDto = {
  name: string;
  adapterId: string;
  hostId?: string;
  config?: Record<string, unknown>;
};

export type UpdateClankerDto = Partial<CreateClankerDto>;
