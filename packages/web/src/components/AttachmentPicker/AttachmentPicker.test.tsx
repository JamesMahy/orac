import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Attachment } from '@orac/shared';
import { AttachmentPicker } from './AttachmentPicker';
import '../../i18n';

vi.mock('@api/messages', () => ({
  messagesApi: {
    uploadAttachment: vi.fn(),
  },
}));

const { messagesApi } = await import('@api/messages');

const mockAttachment: Attachment = {
  attachmentId: 'att-1',
  filename: 'report.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  storageKey: 'ws-1/uuid/report.pdf',
  createdAt: new Date(),
};

function renderPicker(onAttachmentsChange = vi.fn()) {
  return {
    onAttachmentsChange,
    ...render(
      <AttachmentPicker
        workspaceId="ws-1"
        onAttachmentsChange={onAttachmentsChange}
      />,
    ),
  };
}

describe('AttachmentPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the attach file button', () => {
    renderPicker();

    expect(
      screen.getByRole('button', { name: 'Attach file' }),
    ).toBeInTheDocument();
  });

  it('shows no pending files initially', () => {
    renderPicker();

    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });

  it('shows filename after selecting a file', async () => {
    const user = userEvent.setup();
    vi.mocked(messagesApi.uploadAttachment).mockResolvedValue(mockAttachment);
    renderPicker();

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText('Choose files');
    await user.upload(input, file);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('calls onAttachmentsChange with attachment ID after upload', async () => {
    const user = userEvent.setup();
    vi.mocked(messagesApi.uploadAttachment).mockResolvedValue(mockAttachment);
    const { onAttachmentsChange } = renderPicker();

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText('Choose files');
    await user.upload(input, file);

    await waitFor(() => {
      expect(onAttachmentsChange).toHaveBeenCalledWith(['att-1']);
    });
  });

  it('does not include failed upload in attachment IDs', async () => {
    const user = userEvent.setup();
    vi.mocked(messagesApi.uploadAttachment).mockRejectedValue(
      new Error('upload failed'),
    );
    const { onAttachmentsChange } = renderPicker();

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText('Choose files');
    await user.upload(input, file);

    await waitFor(() => {
      expect(onAttachmentsChange).toHaveBeenLastCalledWith([]);
    });
  });

  it('removes file chip when remove button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(messagesApi.uploadAttachment).mockResolvedValue(mockAttachment);
    renderPicker();

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText('Choose files');
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'Remove report.pdf' }),
    );

    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });
});
