export type Project = {
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProjectDto = { name: string; description?: string };
export type UpdateProjectDto = { name?: string; description?: string };
