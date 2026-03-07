import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Message, MessagesPage } from '@orac/shared';
import { messagesApi } from '@api/messages';

const keys = {
  all: (workspaceId: string) => ['messages', workspaceId] as const,
};

export function useMessages(workspaceId: string) {
  const query = useInfiniteQuery({
    queryKey: keys.all(workspaceId),
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages(workspaceId, { before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.messages[lastPage.messages.length - 1]?.messageId;
    },
  });

  // API returns newest-first; reverse into chronological order for display
  const allMessages = query.data?.pages.flatMap(page => page.messages) ?? [];
  const messages = [...allMessages].reverse();

  return { ...query, messages };
}

export function useMessageCache(workspaceId: string) {
  const queryClient = useQueryClient();

  const addMessage = useCallback(
    (message: Message) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        keys.all(workspaceId),
        oldData => {
          if (!oldData) return oldData;
          const [firstPage, ...restPages] = oldData.pages;
          return {
            ...oldData,
            pages: [
              { ...firstPage, messages: [message, ...firstPage.messages] },
              ...restPages,
            ],
          };
        },
      );
    },
    [queryClient, workspaceId],
  );

  return { addMessage };
}
