import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import {
  mockEditorClear,
  mockEditorGetMarkdown,
  resetEditorMocks,
  markdownEditorMock,
} from '../../test/mocks/MarkdownEditor';
import { MessageInput } from './MessageInput';
import '../../i18n';

vi.mock('@api/messages', () => ({
  messagesApi: {
    uploadAttachment: vi.fn(),
  },
}));

vi.mock('@components/MarkdownEditor', () => markdownEditorMock);

function renderMessageInput(overrides: Partial<Parameters<typeof MessageInput>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const defaultProps = {
    workspaceId: 'ws-1',
    clankerOptions: [],
    selectedClankerId: null,
    temperatureOverride: '',
    commands: [],
    isSending: false,
    onClankerChange: vi.fn(),
    onTemperatureChange: vi.fn(),
    onSend: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MessageInput {...defaultProps} />
      </QueryClientProvider>,
    ),
    onSend: defaultProps.onSend,
  };
}

function getEditor() {
  return screen.getByRole('textbox', { name: 'Message...' });
}

describe('MessageInput', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('send button is disabled when editor is empty', () => {
    renderMessageInput();

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeDisabled();
  });

  it('send button is enabled after typing content', async () => {
    const user = userEvent.setup();
    renderMessageInput();

    await user.type(getEditor(), 'Hello');

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeEnabled();
  });

  it('calls onSend with trimmed content when Send is clicked', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    mockEditorGetMarkdown.mockReturnValue('  Hello  ');
    await user.type(getEditor(), '  Hello  ');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Hello', []);
    });
  });

  it('does not call onSend when Enter is pressed by default', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    await user.type(getEditor(), 'Hello');
    await user.keyboard('{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onSend when Shift+Enter is pressed by default', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    mockEditorGetMarkdown.mockReturnValue('Hello');
    await user.type(getEditor(), 'Hello');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Hello', []);
    });
  });

  it('calls onSend when Enter is pressed with "Enter to send" enabled', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    const editor = getEditor();
    mockEditorGetMarkdown.mockReturnValue('Hello');
    await user.type(editor, 'Hello');

    await user.click(screen.getByRole('checkbox', { name: 'Enter to send' }));
    await user.click(editor);
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Hello', []);
    });
  });

  it('clears editor after successful send', async () => {
    const user = userEvent.setup();
    renderMessageInput();

    mockEditorGetMarkdown.mockReturnValue('Hello');
    await user.type(getEditor(), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(mockEditorClear).toHaveBeenCalled();
    });
  });

  it('renders the editor with placeholder', () => {
    renderMessageInput();

    expect(
      screen.getByRole('textbox', { name: 'Message...' }),
    ).toBeInTheDocument();
  });

  it('editor is disabled while isSending', () => {
    renderMessageInput({ isSending: true });

    expect(getEditor()).toBeDisabled();
  });

  it('send button is disabled while isSending', () => {
    renderMessageInput({ isSending: true });

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeDisabled();
  });

  it('renders clanker dropdown when options are provided', () => {
    renderMessageInput({
      clankerOptions: [{ clankerId: 'cl-1', name: 'Claude' }],
      selectedClankerId: 'cl-1',
    });

    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('renders "Enter to send" checkbox', () => {
    renderMessageInput();

    expect(
      screen.getByRole('checkbox', { name: 'Enter to send' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Enter to send' }),
    ).not.toBeChecked();
  });
});
