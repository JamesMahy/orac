import { type ReactNode, useCallback, useMemo } from 'react';
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
  isExisting?: boolean;
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
  isExisting,
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

  const footer = useMemo(() => (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {isExisting && hasUnsavedChanges && onReset && (
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
          disabled={isExisting && !hasUnsavedChanges}
        />
      </div>
    </div>
  ), [isExisting, hasUnsavedChanges, onReset, t, isBusy, extraActions, handleClose, resolvedSaveLabel, onSave, saveSeverity]);

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={header}
      footer={footer}
      dismissableMask={false}
      className="w-full max-w-2xl">
      <div className="min-h-75">
        {isLoading ? (
          <LoadingSpinner
            isLoading
            className="flex min-h-75 items-center justify-center"
          />
        ) : errorMessage ? (
          <FormError message={errorMessage} />
        ) : (
          <div className="p-2">{children}</div>
        )}
      </div>
    </Dialog>
  );
}
