import { type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FormError } from '@components/FormError';
import { LoadingSpinner } from '@components/LoadingSpinner';

type FormModalProps = {
  visible: boolean;
  header: string;
  isLoading?: boolean;
  errorMessage?: string;
  hasUnsavedChanges?: boolean;
  isBusy?: boolean;
  isExistingHost?: boolean;
  onClose: () => void;
  onReset?: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveSeverity?: 'success' | 'warning';
  extraActions?: ReactNode;
  children: ReactNode;
};

export function FormModal({
  visible,
  header,
  isLoading,
  errorMessage,
  hasUnsavedChanges,
  isBusy,
  isExistingHost,
  onClose,
  onReset,
  onSave,
  saveLabel,
  saveSeverity = 'success',
  extraActions,
  children,
}: FormModalProps) {
  const { t } = useTranslation('common', { keyPrefix: 'form' });

  const handleClose = useCallback(() => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        t('You have unsaved changes. Are you sure you want to close?'),
      )
    ) {
      return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose, t]);

  const resolvedSaveLabel = saveLabel ?? (isBusy ? t('Saving...') : t('Save'));

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {isExistingHost && hasUnsavedChanges && onReset && (
          <Button
            label={t('Reset Form')}
            onClick={onReset}
            severity="warning"
            disabled={isBusy}
            text
          />
        )}
        {extraActions}
      </div>
      <div className="flex gap-2">
        <Button
          label={hasUnsavedChanges ? t('Cancel') : t('Close')}
          onClick={handleClose}
          severity="secondary"
          outlined
          disabled={isBusy}
        />
        <Button
          label={resolvedSaveLabel}
          onClick={onSave}
          severity={saveSeverity}
          loading={isBusy}
          disabled={isExistingHost && !hasUnsavedChanges}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={header}
      footer={footer}
      dismissableMask={false}
      className="w-full max-w-2xl">
      <LoadingSpinner isLoading={!!isLoading} className="p-8" />

      <FormError message={errorMessage} />

      {!isLoading && !errorMessage && <div className="p-2">{children}</div>}
    </Dialog>
  );
}
