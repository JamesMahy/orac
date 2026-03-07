import type { ReactNode } from 'react';
import clsx from 'clsx';

type CompactThumbnailProps = {
  children: ReactNode;
  isUser: boolean;
};

export function CompactThumbnail({
  children,
  isUser,
}: CompactThumbnailProps) {
  const background = isUser ? 'bg-white/20' : 'bg-border/50';

  return (
    <div
      className={clsx(
        'flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg',
        background,
      )}>
      {children}
    </div>
  );
}
