import {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ChangeEvent,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Attachment } from '@orac/shared';
import { messagesApi } from '@api/messages';
import { FileChip } from '@components/FileChip';

type PendingFile = {
  id: string;
  file: File;
  uploading: boolean;
  attachment: Attachment | null;
  error: boolean;
};

type AttachmentPickerProps = {
  workspaceId: string;
  showButton?: boolean;
  onAttachmentsChange: (attachmentIds: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  ref?: Ref<AttachmentPickerHandle>;
};

export type AttachmentPickerHandle = {
  open: () => void;
  clear: () => void;
};

function collectAttachmentIds(files: PendingFile[]): string[] {
  return files
    .filter(pending => pending.attachment !== null)
    .map(pending => pending.attachment!.attachmentId);
}

function markUploaded(
  files: PendingFile[],
  target: File,
  attachment: Attachment,
): PendingFile[] {
  return files.map(pending =>
    pending.file === target
      ? { ...pending, uploading: false, attachment }
      : pending,
  );
}

function markFailed(files: PendingFile[], target: File): PendingFile[] {
  return files.map(pending =>
    pending.file === target
      ? { ...pending, uploading: false, error: true }
      : pending,
  );
}

function pendingFileIcon(pending: PendingFile): string {
  if (pending.uploading) return 'pi-spin pi-spinner';
  if (pending.error) return 'pi-exclamation-triangle text-red-500';
  return 'pi-paperclip';
}

function AttachmentPickerInner(
  { workspaceId, showButton = true, onAttachmentsChange, onUploadingChange }: AttachmentPickerProps,
  ref: Ref<AttachmentPickerHandle>,
) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const updateFiles = useCallback(
    (updater: (files: PendingFile[]) => PendingFile[]) => {
      setPendingFiles(previous => {
        const updated = updater(previous);
        onAttachmentsChange(collectAttachmentIds(updated));
        onUploadingChange?.(updated.some(pending => pending.uploading));
        return updated;
      });
    },
    [onAttachmentsChange, onUploadingChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const attachment = await messagesApi.uploadAttachment(
          workspaceId,
          file,
        );
        updateFiles(previous => markUploaded(previous, file, attachment));
      } catch {
        updateFiles(previous => markFailed(previous, file));
      }
    },
    [workspaceId, updateFiles],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      if (selectedFiles.length === 0) return;

      event.target.value = '';

      let counter = Date.now();
      const newEntries: PendingFile[] = selectedFiles.map(file => ({
        id: `${file.name}-${counter++}`,
        file,
        uploading: true,
        attachment: null,
        error: false,
      }));

      updateFiles(previous => [...previous, ...newEntries]);

      for (const entry of newEntries) {
        await uploadFile(entry.file);
      }
    },
    [updateFiles, uploadFile],
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(
    (file: File) => {
      updateFiles(previous =>
        previous.filter(pending => pending.file !== file),
      );
    },
    [updateFiles],
  );

  useImperativeHandle(ref, () => ({
    open: () => fileInputRef.current?.click(),
    clear: () => updateFiles(() => []),
  }), [updateFiles]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label={t('Choose files')}
        onChange={handleFileChange}
      />

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {pendingFiles.map(pending => (
            <FileChip
              key={pending.id}
              filename={pending.file.name}
              icon={pendingFileIcon(pending)}
              onRemove={() => handleRemove(pending.file)}
            />
          ))}
        </div>
      )}

      {showButton && (
        <button
          type="button"
          onClick={handleAttachClick}
          aria-label={t('Attach file')}
          className="shrink-0 rounded-lg p-2 text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <i className="pi pi-paperclip text-lg" aria-hidden="true" />
        </button>
      )}
    </>
  );
}

export const AttachmentPicker = forwardRef(AttachmentPickerInner);
