export type Project = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProjectDto = {
  name: string;
  description: string;
  systemPrompt: string;
  hostId: string;
};

export type UpdateProjectDto = Partial<CreateProjectDto>;
