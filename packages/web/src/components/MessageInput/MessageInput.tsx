import { useState, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdapterCommand } from '@orac/shared';
import { AttachmentPicker, type AttachmentPickerHandle } from '@components/AttachmentPicker';
import { CommandAutocomplete } from '@components/CommandAutocomplete';
import { ClankerSelect } from '@components/ClankerSelect';

const MIN_HEIGHT = 42;
const MAX_HEIGHT = 200;

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = `${MIN_HEIGHT}px`;
  textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
}

type ClankerOption = {
  clankerId: string;
  name: string;
};

type MessageInputProps = {
  workspaceId: string;
  clankerOptions: ClankerOption[];
  selectedClankerId: string | null;
  temperatureOverride: string;
  commands: AdapterCommand[];
  isSending: boolean;
  onClankerChange: (clankerId: string) => void;
  onTemperatureChange: (temperature: string) => void;
  onSend: (content: string, attachmentIds: string[]) => Promise<void>;
};

export function MessageInput({
  workspaceId,
  clankerOptions,
  selectedClankerId,
  temperatureOverride,
  commands,
  isSending,
  onClankerChange,
  onTemperatureChange,
  onSend,
}: MessageInputProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentPickerRef = useRef<AttachmentPickerHandle>(null);

  const [content, setContent] = useState('');
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [commandFilter, setCommandFilter] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [enterToSend, setEnterToSend] = useState(false);

  const hasContent = content.trim().length > 0 || attachmentIds.length > 0;
  const canSend = hasContent && !isSending && !isUploading;

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && attachmentIds.length === 0) return;

    await onSend(trimmed, attachmentIds);

    setContent('');
    setAttachmentIds([]);
    setCommandFilter(null);
    attachmentPickerRef.current?.clear();

    if (textareaRef.current) {
      resizeTextarea(textareaRef.current);
      textareaRef.current.focus();
    }
  }, [content, attachmentIds, onSend]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setContent(value);
      resizeTextarea(event.target);

      const textBeforeCursor = value.slice(0, event.target.selectionStart);
      const commandMatch = textBeforeCursor.match(/^\/(\w*)$/);
      setCommandFilter(commandMatch ? commandMatch[1] : null);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter') return;

      const shouldSend = enterToSend ? !event.shiftKey : event.shiftKey;
      if (!shouldSend) return;

      event.preventDefault();
      if (canSend) void handleSend();
    },
    [enterToSend, canSend, handleSend],
  );

  const handleDismissCommand = useCallback(() => setCommandFilter(null), []);

  const handleAttachClick = useCallback(() => {
    attachmentPickerRef.current?.open();
  }, []);

  const handleCommandSelect = useCallback(
    (command: AdapterCommand) => {
      setCommandFilter(null);
      const updated = `/${command.command} `;
      setContent(updated);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = updated.length;
          textareaRef.current.selectionEnd = updated.length;
        }
      });
    },
    [],
  );

  const handleEnterToSendChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setEnterToSend(event.target.checked);
    },
    [],
  );

  const placeholder = t('Message...');

  const sendHint = enterToSend
    ? t('Enter to send, Shift+Enter for new line')
    : t('Shift+Enter to send, Enter for new line');

  return (
    <div className="border-t border-border bg-surface p-3">
      <div className="relative rounded-xl border border-border bg-surface p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        {commandFilter !== null && commands.length > 0 && (
          <CommandAutocomplete
            filter={commandFilter}
            commands={commands}
            onSelect={handleCommandSelect}
            onDismiss={handleDismissCommand}
          />
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isSending}
          aria-label={t('Message input')}
          className="w-full max-h-50 resize-none overflow-y-auto bg-transparent px-2 py-2 text-base leading-normal text-text placeholder-text-muted focus:outline-none disabled:opacity-50"
          style={{ minHeight: `${MIN_HEIGHT}px` }}
        />

        <AttachmentPicker
          ref={attachmentPickerRef}
          workspaceId={workspaceId}
          showButton={false}
          onAttachmentsChange={setAttachmentIds}
          onUploadingChange={setIsUploading}
        />

        <div className="flex items-center gap-2">
          <ClankerSelect
            options={clankerOptions}
            selectedClankerId={selectedClankerId}
            temperatureOverride={temperatureOverride}
            onSelect={onClankerChange}
            onTemperatureChange={onTemperatureChange}
          />

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleAttachClick}
              aria-label={t('Attach file')}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <i className="pi pi-paperclip text-lg" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              title={isUploading ? t('Waiting for uploads to finish') : undefined}
              aria-label={t('Send message')}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-base font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40">
              <i
                className={`pi ${isSending ? 'pi-spin pi-spinner' : 'pi-send'}`}
                aria-hidden="true"
              />
              {t('Send')}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1">
        <p className="text-base text-text-muted/60">
          {sendHint}
        </p>
        <label className="flex items-center gap-1.5 text-base text-text-muted/60">
          <input
            type="checkbox"
            checked={enterToSend}
            onChange={handleEnterToSendChange}
            className="rounded border-border text-primary focus:ring-primary"
          />
          {t('Enter to send')}
        </label>
      </div>
    </div>
  );
}
