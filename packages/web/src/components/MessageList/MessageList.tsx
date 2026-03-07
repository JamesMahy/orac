import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '@orac/shared';
import { MessageGroup } from '@components/MessageBubble';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
};

function belongsToGroup(group: Message[], message: Message): boolean {
  const last = group[group.length - 1];
  const timeDifference = Math.abs(
    new Date(message.createdAt).getTime() -
      new Date(last.createdAt).getTime(),
  );

  return (
    last.role === message.role &&
    last.senderName === message.senderName &&
    timeDifference < 60_000
  );
}

function groupMessages(messages: Message[]): Message[][] {
  return messages.reduce<Message[][]>((groups, message) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && belongsToGroup(lastGroup, message)) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, []);
}

export function MessageList({
  messages,
  isLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: MessageListProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    setIsAtBottom(distanceFromBottom < 100);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isAtBottom]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <i
          className="pi pi-spin pi-spinner text-2xl text-text-muted"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label={t('Message history')}>
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-base text-text-muted transition-colors hover:bg-border/50 hover:text-text disabled:opacity-50">
            <i
              className={`pi text-base ${isFetchingMore ? 'pi-spin pi-spinner' : 'pi-arrow-up'}`}
              aria-hidden="true"
            />
            {isFetchingMore
              ? t('Loading older messages')
              : t('Load older messages')}
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-base text-text-muted">{t('No messages yet')}</p>
        </div>
      )}

      {groups.map(group => (
        <MessageGroup
          key={group[0].messageId}
          messages={group}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
