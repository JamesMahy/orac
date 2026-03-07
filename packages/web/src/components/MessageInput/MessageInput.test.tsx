import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { MessageInput } from './MessageInput';
import '../../i18n';

vi.mock('@api/messages', () => ({
  messagesApi: {
    uploadAttachment: vi.fn(),
  },
}));

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

describe('MessageInput', () => {
  it('send button is disabled when textarea is empty', () => {
    renderMessageInput();

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeDisabled();
  });

  it('send button is enabled after typing content', async () => {
    const user = userEvent.setup();
    renderMessageInput();

    await user.type(screen.getByRole('textbox', { name: 'Message input' }), 'Hello');

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeEnabled();
  });

  it('calls onSend with trimmed content when Send is clicked', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    await user.type(screen.getByRole('textbox', { name: 'Message input' }), '  Hello  ');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('does not call onSend when Enter is pressed by default', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    const textarea = screen.getByRole('textbox', { name: 'Message input' });
    await user.type(textarea, 'Hello');
    await user.keyboard('{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onSend when Shift+Enter is pressed by default', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    const textarea = screen.getByRole('textbox', { name: 'Message input' });
    await user.type(textarea, 'Hello');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('calls onSend when Enter is pressed with "Enter to send" enabled', async () => {
    const user = userEvent.setup();
    const { onSend } = renderMessageInput();

    const textarea = screen.getByRole('textbox', { name: 'Message input' });
    await user.type(textarea, 'Hello');

    // Enable "Enter to send"
    await user.click(screen.getByRole('checkbox', { name: 'Enter to send' }));

    // Re-focus textarea and press Enter
    await user.click(textarea);
    await user.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('clears textarea after successful send', async () => {
    const user = userEvent.setup();
    renderMessageInput();

    const textarea = screen.getByRole('textbox', { name: 'Message input' });
    await user.type(textarea, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(textarea).toHaveValue('');
  });

  it('shows placeholder text', () => {
    renderMessageInput();

    expect(screen.getByPlaceholderText('Message...')).toBeInTheDocument();
  });

  it('textarea is disabled while isSending', () => {
    renderMessageInput({ isSending: true });

    expect(
      screen.getByRole('textbox', { name: 'Message input' }),
    ).toBeDisabled();
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
