import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { Message } from '@orac/shared';
import { AttachmentBubble } from '@components/AttachmentBubble';

type MessageGroupProps = {
  messages: Message[];
};

function SenderHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <i
        className="pi pi-android text-base text-text-muted"
        aria-hidden="true"
      />
      <span className="text-base font-medium text-text-muted">{name}</span>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageGroup({ messages }: MessageGroupProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });

  const first = messages[0];
  const last = messages[messages.length - 1];
  const isUser = first.role === 'user';

  const allAttachments = messages.flatMap(message => message.attachments);
  const hasMultipleAttachments = allAttachments.length > 1;
  const hasError = messages.some(message => message.status === 'error');
  const contentMessages = messages.filter(message => message.content);

  const bubbleColor = isUser
    ? 'rounded-tr-sm bg-primary text-white'
    : 'rounded-tl-sm bg-border/30 text-text';
  const timestampColor = isUser ? 'text-white/60' : 'text-text-muted/60';
  const alignment = isUser ? 'items-end' : 'items-start';

  return (
    <div className={clsx('flex flex-col gap-1', alignment)}>
      {!isUser && <SenderHeader name={first.senderName} />}

      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-base leading-relaxed',
          bubbleColor,
        )}>
        {contentMessages.map((message, index) => (
          <p
            key={message.messageId}
            className={clsx(
              'whitespace-pre-wrap wrap-break-word',
              index > 0 && 'mt-2',
            )}>
            {message.content}
          </p>
        ))}

        <p className={clsx('mt-1 text-right text-xs', timestampColor)}>
          {formatTime(last.createdAt)}
        </p>
      </div>

      {allAttachments.length > 0 && (
        <div
          className={clsx(
            'max-w-[75%] flex flex-wrap gap-1.5',
            hasMultipleAttachments && 'rounded-2xl p-2',
            hasMultipleAttachments && bubbleColor,
          )}>
          {allAttachments.map(attachment => (
            <AttachmentBubble
              key={attachment.attachmentId}
              attachment={attachment}
              isUser={isUser}
              compact={hasMultipleAttachments}
            />
          ))}
        </div>
      )}

      {hasError && (
        <p className="px-1 text-base text-red-500">{t('Message failed')}</p>
      )}
    </div>
  );
}
