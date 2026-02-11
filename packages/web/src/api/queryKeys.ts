export const queryKeys = {
  hosts: ['hosts'] as const,
  host: (id: string) => ['host', id] as const,
};
