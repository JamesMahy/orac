export type DirectoryEntry = {
  name: string;
  type: 'directory' | 'file';
  size: number;
};

export type BrowseDirectoryResponse = {
  path: string;
  parentPath: string | null;
  entries: DirectoryEntry[];
};
