import type { MouseEvent } from 'react';
import clsx from 'clsx';
import type { Attachment } from '@orac/shared';
import { formatFileSize } from '@utils/formatFileSize';

type FullImagePreviewProps = {
  attachment: Attachment;
  fileUrl: string;
  imageSrc: string;
  isUser: boolean;
  onImageError: () => void;
  onImageClick: (event: MouseEvent) => void;
};

export function FullImagePreview({
  attachment,
  fileUrl,
  imageSrc,
  isUser,
  onImageError,
  onImageClick,
}: FullImagePreviewProps) {
  const sizeColor = isUser ? 'text-white/70' : 'text-text-muted';

  return (
    <>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onImageClick}
        className="block">
        <img
          src={imageSrc}
          alt={attachment.filename}
          onError={onImageError}
          className="max-h-64 w-full object-contain"
        />
      </a>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2 hover:underline">
        <p className="truncate text-xs font-medium">
          {attachment.filename}
        </p>
        <p className={clsx('text-xs', sizeColor)}>
          {formatFileSize(attachment.size)}
        </p>
      </a>
    </>
  );
}
