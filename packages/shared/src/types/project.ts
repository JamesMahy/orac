export type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProjectDto = { name: string };
export type UpdateProjectDto = { name?: string };
