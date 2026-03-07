import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { Message } from '@orac/shared';
import { MessageGroup } from './MessageBubble';
import '../../i18n';

vi.mock('@api/messages', () => ({
  messagesApi: {
    getAttachmentContent: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const baseMessage: Message = {
  messageId: 'msg-1',
  workspaceId: 'ws-1',
  userId: 'admin',
  senderName: 'Alice',
  role: 'user',
  content: 'Hello world',
  toolCalls: null,
  rawEvents: null,
  status: 'complete',
  createdAt: new Date('2026-03-07T14:30:00Z'),
  attachments: [],
};

describe('MessageGroup', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('does not render sender name for user messages', () => {
    renderWithProviders(<MessageGroup messages={[baseMessage]} />);

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders sender name and icon for assistant messages', () => {
    const assistantMessage: Message = {
      ...baseMessage,
      role: 'assistant',
      senderName: 'Claude',
    };
    renderWithProviders(<MessageGroup messages={[assistantMessage]} />);

    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('renders formatted time', () => {
    renderWithProviders(<MessageGroup messages={[baseMessage]} />);

    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders multiple messages in a single bubble', () => {
    const messages: Message[] = [
      { ...baseMessage, messageId: 'msg-1', content: 'First' },
      { ...baseMessage, messageId: 'msg-2', content: 'Second' },
    ];

    renderWithProviders(<MessageGroup messages={messages} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    // Only one timestamp
    expect(screen.getAllByText(/\d{1,2}:\d{2}/)).toHaveLength(1);
  });

  it('renders attachment filenames when present', () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        {
          attachmentId: 'att-1',
          filename: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageKey: 'ws-1/uuid/report.pdf',
          createdAt: new Date(),
        },
        {
          attachmentId: 'att-2',
          filename: 'notes.txt',
          mimeType: 'text/plain',
          size: 2048,
          storageKey: 'ws-1/uuid/notes.txt',
          createdAt: new Date(),
        },
      ],
    };

    renderWithProviders(<MessageGroup messages={[message]} />);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('renders file size for non-image attachments', () => {
    const message: Message = {
      ...baseMessage,
      attachments: [
        {
          attachmentId: 'att-1',
          filename: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageKey: 'ws-1/uuid/report.pdf',
          createdAt: new Date(),
        },
      ],
    };

    renderWithProviders(<MessageGroup messages={[message]} />);

    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('shows no attachment section when attachments are empty', () => {
    renderWithProviders(<MessageGroup messages={[baseMessage]} />);

    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });

  it('shows error text when any message has error status', () => {
    const message: Message = { ...baseMessage, status: 'error' };

    renderWithProviders(<MessageGroup messages={[message]} />);

    expect(screen.getByText('Failed to send')).toBeInTheDocument();
  });

  it('does not show error text for non-error statuses', () => {
    renderWithProviders(<MessageGroup messages={[baseMessage]} />);

    expect(screen.queryByText('Failed to send')).not.toBeInTheDocument();
  });
});
