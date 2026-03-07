import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Attachment } from '@orac/shared';
import { AttachmentBubble } from './AttachmentBubble';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, enabled: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-md p-4">{children}</div>
    </QueryClientProvider>
  );
}

const pdfAttachment: Attachment = {
  attachmentId: 'att-1',
  filename: 'annual-report-2026.pdf',
  mimeType: 'application/pdf',
  size: 2_400_000,
  storageKey: 'ws-1/uuid/annual-report-2026.pdf',
  createdAt: new Date(),
};

const textAttachment: Attachment = {
  attachmentId: 'att-2',
  filename: 'notes.txt',
  mimeType: 'text/plain',
  size: 340,
  storageKey: 'ws-1/uuid/notes.txt',
  createdAt: new Date(),
};

const audioAttachment: Attachment = {
  attachmentId: 'att-3',
  filename: 'recording.mp3',
  mimeType: 'audio/mpeg',
  size: 5_100_000,
  storageKey: 'ws-1/uuid/recording.mp3',
  createdAt: new Date(),
};

const imageAttachment: Attachment = {
  attachmentId: 'att-4',
  filename: 'screenshot.png',
  mimeType: 'image/png',
  size: 128_000,
  storageKey: 'ws-1/uuid/screenshot.png',
  createdAt: new Date(),
};

const meta: Meta<typeof AttachmentBubble> = {
  title: 'Components/AttachmentBubble',
  component: AttachmentBubble,
  decorators: [
    Story => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AttachmentBubble>;

export const PdfFile: Story = {
  args: { attachment: pdfAttachment, isUser: false },
};

export const PdfFileUser: Story = {
  args: { attachment: pdfAttachment, isUser: true },
};

export const TextFile: Story = {
  args: { attachment: textAttachment, isUser: false },
};

export const AudioFile: Story = {
  args: { attachment: audioAttachment, isUser: false },
};

export const ImageLoading: Story = {
  args: { attachment: imageAttachment, isUser: false },
};

export const CompactPdf: Story = {
  args: { attachment: pdfAttachment, isUser: false, compact: true },
};

export const CompactPdfUser: Story = {
  args: { attachment: pdfAttachment, isUser: true, compact: true },
};

export const CompactText: Story = {
  args: { attachment: textAttachment, isUser: false, compact: true },
};

export const CompactImageLoading: Story = {
  args: { attachment: imageAttachment, isUser: false, compact: true },
};
