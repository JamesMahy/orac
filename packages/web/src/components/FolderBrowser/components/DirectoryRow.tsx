import type { DirectoryEntry } from '@orac/shared';

type DirectoryRowProps = {
  entry: DirectoryEntry;
  onNavigate: (path: string) => void;
  resolvedPath: string;
};

export function DirectoryRow({
  entry,
  onNavigate,
  resolvedPath,
}: DirectoryRowProps) {
  const targetPath =
    resolvedPath === '/' ? `/${entry.name}` : `${resolvedPath}/${entry.name}`;

  return (
    <button
      type="button"
      role="listitem"
      className="group flex w-full cursor-pointer items-center gap-3 border-b border-surface-border px-3 py-3 text-left hover:bg-surface-hover"
      onClick={() => onNavigate(targetPath)}>
      <i className="pi pi-folder text-primary" aria-hidden="true" />
      <span className="group-hover:underline">{entry.name}</span>
    </button>
  );
}
