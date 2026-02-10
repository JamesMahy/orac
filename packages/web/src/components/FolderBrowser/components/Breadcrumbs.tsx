type BreadcrumbsProps = {
  segments: { label: string; path: string }[];
  onNavigate: (path: string) => void;
};

export function Breadcrumbs({ segments, onNavigate }: BreadcrumbsProps) {
  if (segments.length === 0) return null;

  return (
    <nav
      className="mb-3 flex flex-wrap items-center gap-1 text-sm"
      aria-label="Breadcrumb">
      {segments.map((segment, index) => (
        <span key={segment.path} className="flex items-center gap-1">
          {index === 1 && (
            <i
              className="pi pi-chevron-right text-xs text-muted-color"
              aria-hidden="true"
            />
          )}
          {index > 1 && (
            <span className="text-muted-color" aria-hidden="true">
              /
            </span>
          )}
          <button
            type="button"
            className="cursor-pointer text-primary hover:underline"
            onClick={() => onNavigate(segment.path)}>
            {segment.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
