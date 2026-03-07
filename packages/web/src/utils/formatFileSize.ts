const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatFileSize(bytes: number): string {
  let value = bytes;
  for (const unit of UNITS) {
    if (value < 1024 || unit === 'GB') {
      return unit === 'B'
        ? `${value} ${unit}`
        : `${value.toFixed(1)} ${unit}`;
    }
    value /= 1024;
  }
  return `${bytes} B`;
}
