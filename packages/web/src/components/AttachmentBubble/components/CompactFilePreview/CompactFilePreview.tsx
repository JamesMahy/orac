import clsx from 'clsx';
import type { Attachment } from '@orac/shared';
import { fileIcon } from '@utils/fileIcon';

type CompactFilePreviewProps = {
  attachment: Attachment;
};

export function CompactFilePreview({
  attachment,
}: CompactFilePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <i
        className={clsx(fileIcon(attachment.mimeType), 'text-lg')}
        aria-hidden="true"
      />
      <span className="max-w-20 truncate text-[10px]">
        {attachment.filename}
      </span>
    </div>
  );
}
