export type Project = {
  id: string;
  hostId: string;
  name: string;
  path: string;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProjectDto = {
  name: string;
  path: string;
  hostId: string;
};

export type UpdateProjectDto = Partial<CreateProjectDto>;
