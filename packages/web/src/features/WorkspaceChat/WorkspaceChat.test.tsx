import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { Workspace, Message, MessagesPage } from '@orac/shared';
import { WorkspaceChat } from './WorkspaceChat';
import '../../i18n';

vi.mock('@api/workspaces', () => ({
  workspacesApi: {
    getById: vi.fn(),
  },
}));

vi.mock('@api/messages', () => ({
  messagesApi: {
    getMessages: vi.fn(),
    createMessage: vi.fn(),
    uploadAttachment: vi.fn(),
  },
}));

vi.mock('@api/clankerAdapters', () => ({
  adaptersApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

const { workspacesApi } = await import('@api/workspaces');
const { messagesApi } = await import('@api/messages');

const mockWorkspace: Workspace = {
  workspaceId: 'ws-1',
  projectId: 'proj-1',
  name: 'Test Workspace',
  hostId: null,
  path: null,
  primaryClankerId: 'cl-1',
  primaryClanker: { clankerId: 'cl-1', name: 'Claude', clankerAdapterId: 'claude-code' },
  currentClankerId: 'cl-1',
  primaryVaultId: null,
  clankers: [
    {
      clankerId: 'cl-1',
      name: 'Claude',
      clankerAdapterId: 'claude-code',
      modelOverride: null,
      temperatureOverride: null,
    },
  ],
  sessionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMessage: Message = {
  messageId: 'msg-1',
  workspaceId: 'ws-1',
  userId: 'admin',
  senderName: 'User',
  role: 'user',
  content: 'Hello!',
  toolCalls: null,
  rawEvents: null,
  status: 'complete',
  createdAt: new Date(),
  attachments: [],
};

const emptyPage: MessagesPage = { messages: [], hasMore: false };
const pageWithMessage: MessagesPage = {
  messages: [mockMessage],
  hasMore: false,
};

function renderChat(workspaceId = 'ws-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkspaceChat workspaceId={workspaceId} />
    </QueryClientProvider>,
  );
}

describe('WorkspaceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while workspace is loading', () => {
    vi.mocked(workspacesApi.getById).mockReturnValue(new Promise(() => {}));
    vi.mocked(messagesApi.getMessages).mockResolvedValue(emptyPage);

    renderChat();

    expect(screen.queryByRole('log')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows workspace not found when workspace is null', async () => {
    vi.mocked(workspacesApi.getById).mockRejectedValue(
      new Error('not found'),
    );
    vi.mocked(messagesApi.getMessages).mockResolvedValue(emptyPage);

    renderChat();

    expect(
      await screen.findByText('Workspace not found'),
    ).toBeInTheDocument();
  });

  it('renders message list and input when workspace loads', async () => {
    vi.mocked(workspacesApi.getById).mockResolvedValue(mockWorkspace);
    vi.mocked(messagesApi.getMessages).mockResolvedValue(emptyPage);

    renderChat();

    expect(await screen.findByRole('log')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Message input' }),
    ).toBeInTheDocument();
  });

  it('displays messages from the API', async () => {
    vi.mocked(workspacesApi.getById).mockResolvedValue(mockWorkspace);
    vi.mocked(messagesApi.getMessages).mockResolvedValue(pageWithMessage);

    renderChat();

    expect(await screen.findByText('Hello!')).toBeInTheDocument();
  });

  it('sends a message when the user types and clicks Send', async () => {
    const user = userEvent.setup();
    vi.mocked(workspacesApi.getById).mockResolvedValue(mockWorkspace);
    vi.mocked(messagesApi.getMessages).mockResolvedValue(emptyPage);
    vi.mocked(messagesApi.createMessage).mockResolvedValue(mockMessage);

    renderChat();

    const textarea = await screen.findByRole('textbox', {
      name: 'Message input',
    });
    await user.type(textarea, 'Test message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(messagesApi.createMessage).toHaveBeenCalledWith('ws-1', {
        content: 'Test message',
        targetClankerId: 'cl-1',
        attachmentIds: undefined,
      });
    });
  });

  it('clears input after successful send', async () => {
    const user = userEvent.setup();
    vi.mocked(workspacesApi.getById).mockResolvedValue(mockWorkspace);
    vi.mocked(messagesApi.getMessages).mockResolvedValue(emptyPage);
    vi.mocked(messagesApi.createMessage).mockResolvedValue(mockMessage);

    renderChat();

    const textarea = await screen.findByRole('textbox', {
      name: 'Message input',
    });
    await user.type(textarea, 'Test message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});
