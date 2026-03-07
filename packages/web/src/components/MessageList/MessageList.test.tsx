import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Message } from '@orac/shared';
import { MessageList } from './MessageList';
import '../../i18n';

const mockMessage = (overrides: Partial<Message> = {}): Message => ({
  messageId: 'msg-1',
  workspaceId: 'ws-1',
  userId: 'admin',
  senderName: 'Alice',
  role: 'user',
  content: 'Hello',
  toolCalls: null,
  rawEvents: null,
  status: 'complete',
  createdAt: new Date(),
  attachments: [],
  ...overrides,
});

const defaultProps = {
  messages: [] as Message[],
  isLoading: false,
  hasMore: false,
  isFetchingMore: false,
  onLoadMore: vi.fn(),
};

describe('MessageList', () => {
  it('shows spinner when loading', () => {
    render(<MessageList {...defaultProps} isLoading={true} />);

    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<MessageList {...defaultProps} />);

    expect(
      screen.getByText('No messages yet. Send a message to get started.'),
    ).toBeInTheDocument();
  });

  it('renders messages', () => {
    const messages = [
      mockMessage({ messageId: 'msg-1', content: 'Hi' }),
      mockMessage({
        messageId: 'msg-2',
        role: 'assistant',
        senderName: 'Bot',
        content: 'Hello!',
      }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText('Bot')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('shows load-more button when hasMore is true', () => {
    render(
      <MessageList
        {...defaultProps}
        messages={[mockMessage()]}
        hasMore={true}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Load older messages/ }),
    ).toBeInTheDocument();
  });

  it('hides load-more button when hasMore is false', () => {
    render(
      <MessageList
        {...defaultProps}
        messages={[mockMessage()]}
        hasMore={false}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Load older messages/ }),
    ).not.toBeInTheDocument();
  });

  it('calls onLoadMore when load-more button is clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();

    render(
      <MessageList
        {...defaultProps}
        messages={[mockMessage()]}
        hasMore={true}
        onLoadMore={onLoadMore}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Load older messages/ }),
    );

    expect(onLoadMore).toHaveBeenCalled();
  });

  it('disables load-more button while fetching', () => {
    render(
      <MessageList
        {...defaultProps}
        messages={[mockMessage()]}
        hasMore={true}
        isFetchingMore={true}
      />,
    );

    const button = screen.getByRole('button', { name: /Loading/ });

    expect(button).toBeDisabled();
  });

  it('has correct ARIA attributes', () => {
    render(<MessageList {...defaultProps} messages={[mockMessage()]} />);

    const log = screen.getByRole('log');

    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAttribute('aria-label', 'Message history');
  });
});
