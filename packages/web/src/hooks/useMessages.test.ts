import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { Message, MessagesPage } from '@orac/shared';
import { useMessages, useMessageCache } from './useMessages';
import { createElement, type ReactNode } from 'react';

vi.mock('@api/messages', () => ({
  messagesApi: {
    getMessages: vi.fn(),
  },
}));

const { messagesApi } = await import('@api/messages');

const msg = (messageId: string): Message => ({
  messageId,
  workspaceId: 'ws-1',
  userId: 'admin',
  senderName: 'User',
  role: 'user',
  content: `Message ${messageId}`,
  toolCalls: null,
  rawEvents: null,
  status: 'complete',
  createdAt: new Date(),
  attachments: [],
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty messages before data arrives', () => {
    vi.mocked(messagesApi.getMessages).mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMessages('ws-1'), { wrapper });

    expect(result.current.messages).toEqual([]);
  });

  it('returns messages in chronological order (oldest first)', async () => {
    vi.mocked(messagesApi.getMessages).mockResolvedValue({
      messages: [msg('msg-3'), msg('msg-2'), msg('msg-1')],
      hasMore: false,
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMessages('ws-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    expect(result.current.messages[0].messageId).toBe('msg-1');
    expect(result.current.messages[1].messageId).toBe('msg-2');
    expect(result.current.messages[2].messageId).toBe('msg-3');
  });

  it('hasNextPage is false when hasMore is false', async () => {
    vi.mocked(messagesApi.getMessages).mockResolvedValue({
      messages: [msg('msg-1')],
      hasMore: false,
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMessages('ws-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  it('hasNextPage is true when hasMore is true', async () => {
    vi.mocked(messagesApi.getMessages).mockResolvedValue({
      messages: [msg('msg-1')],
      hasMore: true,
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMessages('ws-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(true);
    });
  });
});

describe('useMessageCache', () => {
  it('addMessage prepends to the first page', async () => {
    const { queryClient, wrapper } = createWrapper();

    const existingData: InfiniteData<MessagesPage> = {
      pages: [{ messages: [msg('msg-2')], hasMore: false }],
      pageParams: [undefined],
    };
    queryClient.setQueryData(['messages', 'ws-1'], existingData);

    const { result } = renderHook(() => useMessageCache('ws-1'), { wrapper });

    result.current.addMessage(msg('msg-3'));

    const cached = queryClient.getQueryData<InfiniteData<MessagesPage>>([
      'messages',
      'ws-1',
    ]);

    expect(cached?.pages[0].messages).toHaveLength(2);
    expect(cached?.pages[0].messages[0].messageId).toBe('msg-3');
    expect(cached?.pages[0].messages[1].messageId).toBe('msg-2');
  });
});
