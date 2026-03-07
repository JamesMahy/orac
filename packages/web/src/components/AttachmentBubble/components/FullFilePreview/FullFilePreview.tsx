import clsx from 'clsx';
import type { Attachment } from '@orac/shared';
import { formatFileSize } from '@utils/formatFileSize';
import { fileIcon } from '@utils/fileIcon';

type FullFilePreviewProps = {
  attachment: Attachment;
  fileUrl: string;
  isUser: boolean;
};

export function FullFilePreview({
  attachment,
  fileUrl,
  isUser,
}: FullFilePreviewProps) {
  const sizeColor = isUser ? 'text-white/70' : 'text-text-muted';

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3">
      <i
        className={clsx(
          fileIcon(attachment.mimeType),
          'text-xl shrink-0',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{attachment.filename}</p>
        <p className={clsx('text-xs', sizeColor)}>
          {formatFileSize(attachment.size)}
        </p>
      </div>
    </a>
  );
}
