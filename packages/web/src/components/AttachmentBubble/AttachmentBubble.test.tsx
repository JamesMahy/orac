import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { Attachment } from '@orac/shared';
import { AttachmentBubble } from './AttachmentBubble';
import '../../i18n';

vi.mock('@api/messages', () => ({
  messagesApi: {
    getAttachmentContent: vi.fn(),
  },
}));

const { messagesApi } = await import('@api/messages');

const pdfAttachment: Attachment = {
  attachmentId: 'att-1',
  filename: 'report.pdf',
  mimeType: 'application/pdf',
  size: 2048,
  storageKey: 'ws-1/uuid/report.pdf',
  createdAt: new Date(),
};

const imageAttachment: Attachment = {
  attachmentId: 'att-2',
  filename: 'photo.png',
  mimeType: 'image/png',
  size: 51200,
  storageKey: 'ws-1/uuid/photo.png',
  createdAt: new Date(),
};

function renderBubble(
  attachment: Attachment,
  overrides: { isUser?: boolean; compact?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AttachmentBubble
        attachment={attachment}
        isUser={overrides.isUser ?? false}
        compact={overrides.compact}
      />
    </QueryClientProvider>,
  );
}

describe('AttachmentBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('full view — file attachment', () => {
    it('renders the filename', () => {
      renderBubble(pdfAttachment);

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('renders the file size', () => {
      renderBubble(pdfAttachment);

      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('renders a download link', () => {
      renderBubble(pdfAttachment);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        '/api/attachments/att-1/file/report.pdf',
      );
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('full view — image attachment', () => {
    it('shows a loading spinner while image content is fetching', () => {
      vi.mocked(messagesApi.getAttachmentContent).mockReturnValue(
        new Promise(() => {}),
      );

      renderBubble(imageAttachment);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders the image when content is loaded', async () => {
      vi.mocked(messagesApi.getAttachmentContent).mockResolvedValue({
        attachmentId: 'att-2',
        filename: 'photo.png',
        mimeType: 'image/png',
        content: 'base64data',
      });

      renderBubble(imageAttachment);

      const image = await screen.findByAltText('photo.png');
      expect(image).toHaveAttribute(
        'src',
        'data:image/png;base64,base64data',
      );
    });
  });

  describe('compact view — file attachment', () => {
    it('renders the filename in a tooltip', () => {
      renderBubble(pdfAttachment, { compact: true });

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('title', 'report.pdf (2.0 KB)');
    });

    it('renders a compact thumbnail', () => {
      renderBubble(pdfAttachment, { compact: true });

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
  });

  describe('image overlay', () => {
    it('opens overlay on image click and closes on overlay click', async () => {
      const user = userEvent.setup();
      vi.mocked(messagesApi.getAttachmentContent).mockResolvedValue({
        attachmentId: 'att-2',
        filename: 'photo.png',
        mimeType: 'image/png',
        content: 'base64data',
      });

      renderBubble(imageAttachment);

      const image = await screen.findByAltText('photo.png');
      await user.click(image);

      const overlay = screen.getByRole('dialog');
      expect(overlay).toBeInTheDocument();

      await user.click(overlay);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('user vs clanker styling', () => {
    it('applies user styling when isUser is true', () => {
      const { container } = renderBubble(pdfAttachment, { isUser: true });

      const bubble = container.querySelector('.bg-primary');
      expect(bubble).toBeInTheDocument();
    });

    it('applies clanker styling when isUser is false', () => {
      const { container } = renderBubble(pdfAttachment, { isUser: false });

      const bubble = container.querySelector('.bg-border\\/30');
      expect(bubble).toBeInTheDocument();
    });
  });
});
