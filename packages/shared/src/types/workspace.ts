export type Workspace = {
  workspaceId: string;
  projectId: string;
  hostId: string;
  name: string;
  path: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWorkspaceDto = {
  projectId: string;
  hostId: string;
  name: string;
  path?: string;
};

export type UpdateWorkspaceDto = {
  name?: string;
  path?: string;
};
