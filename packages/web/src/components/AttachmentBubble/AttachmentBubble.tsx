import { useState, useCallback, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import type { Attachment } from '@orac/shared';
import { messagesApi } from '@api/messages';
import { formatFileSize } from '@utils/formatFileSize';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { ImageOverlay } from './components/ImageOverlay';
import { CompactThumbnail } from './components/CompactThumbnail';
import { CompactFilePreview } from './components/CompactFilePreview';
import { FullFilePreview } from './components/FullFilePreview';
import { FullImagePreview } from './components/FullImagePreview';

type AttachmentBubbleProps = {
  attachment: Attachment;
  isUser: boolean;
  compact?: boolean;
};

export function AttachmentBubble({
  attachment,
  isUser,
  compact = false,
}: AttachmentBubbleProps) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isImage = attachment.mimeType.startsWith('image/') && !imageError;

  const contentQuery = useQuery({
    queryKey: ['attachment-content', attachment.attachmentId],
    queryFn: () => messagesApi.getAttachmentContent(attachment.attachmentId),
    enabled: isImage,
    staleTime: Infinity,
  });

  const handleImageError = useCallback(() => setImageError(true), []);
  const handleImageClick = useCallback(
    (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      setExpanded(true);
    },
    [],
  );
  const handleOverlayClose = useCallback(() => setExpanded(false), []);

  const imageSrc = contentQuery.data
    ? `data:${attachment.mimeType};base64,${contentQuery.data.content}`
    : undefined;

  const fileUrl = `/api/attachments/${attachment.attachmentId}/file/${encodeURIComponent(attachment.filename)}`;

  const bubbleColor = isUser
    ? 'rounded-tr-sm bg-primary text-white'
    : 'rounded-tl-sm bg-border/30 text-text';

  if (compact) {
    return (
      <>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={isImage ? handleImageClick : undefined}
          title={`${attachment.filename} (${formatFileSize(attachment.size)})`}>
          <CompactThumbnail isUser={isUser}>
            {isImage && imageSrc && (
              <img
                src={imageSrc}
                alt={attachment.filename}
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            )}
            {isImage && !imageSrc && (
              <LoadingSpinner isLoading className="text-sm" />
            )}
            {!isImage && <CompactFilePreview attachment={attachment} />}
          </CompactThumbnail>
        </a>

        {expanded && imageSrc && (
          <ImageOverlay
            src={imageSrc}
            alt={attachment.filename}
            onClose={handleOverlayClose}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={clsx(
          'max-w-[75%] overflow-hidden rounded-2xl text-sm',
          bubbleColor,
        )}>
        {isImage && imageSrc && (
          <FullImagePreview
            attachment={attachment}
            fileUrl={fileUrl}
            imageSrc={imageSrc}
            isUser={isUser}
            onImageError={handleImageError}
            onImageClick={handleImageClick}
          />
        )}
        {isImage && !imageSrc && (
          <LoadingSpinner isLoading className="h-32 w-48" />
        )}
        {!isImage && (
          <FullFilePreview
            attachment={attachment}
            fileUrl={fileUrl}
            isUser={isUser}
          />
        )}
      </div>

      {expanded && imageSrc && (
        <ImageOverlay
          src={imageSrc}
          alt={attachment.filename}
          onClose={handleOverlayClose}
        />
      )}
    </>
  );
}
