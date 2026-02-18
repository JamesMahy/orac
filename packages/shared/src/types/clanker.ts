export type ClankerAdapter = {
  adapterId: string;
  name: string;
};

export type ClankerHost = {
  hostId: string;
  name: string;
};

export type Clanker = {
  clankerId: string;
  name: string;
  adapter: ClankerAdapter;
  host: ClankerHost | null;
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
