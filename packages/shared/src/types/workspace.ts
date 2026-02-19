export type WorkspaceClanker = {
  clankerId: string;
  name: string;
  modelOverride: string | null;
  temperatureOverride: number | null;
};

export type Workspace = {
  workspaceId: string;
  projectId: string;
  name: string;
  hostId: string | null;
  path: string | null;
  primaryClankerId: string | null;
  primaryClanker: { clankerId: string; name: string } | null;
  currentClankerId: string | null;
  clankers: WorkspaceClanker[];
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWorkspaceDto = {
  projectId: string;
  name: string;
  primaryClankerId: string;
  hostId?: string;
  path?: string;
  clankers?: { clankerId: string; modelOverride?: string; temperatureOverride?: number }[];
};

export type UpdateWorkspaceDto = {
  name?: string;
  path?: string;
  hostId?: string | null;
  primaryClankerId?: string;
  currentClankerId?: string | null;
};

export type AddWorkspaceClankerDto = {
  clankerId: string;
  modelOverride?: string;
  temperatureOverride?: number;
};
