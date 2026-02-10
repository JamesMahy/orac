import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import type { Control, FieldErrors } from 'react-hook-form';
import { FormPasswordInput } from '@components/PasswordInput';
import type { SshFormData } from '../../hosts.types';

type SshPasswordFieldProps = {
  control: Control<SshFormData>;
  errors: FieldErrors<SshFormData>;
  isSubmitted: boolean;
  isExistingHost: boolean;
  hasPassword: boolean;
  isChangingPassword: boolean;
  onChangePassword: () => void;
  onRemovePassword: () => void;
};

export function SshPasswordField({
  control,
  errors,
  isSubmitted,
  isExistingHost,
  hasPassword,
  isChangingPassword,
  onChangePassword,
  onRemovePassword,
}: SshPasswordFieldProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });

  if (isExistingHost && hasPassword && !isChangingPassword) {
    return (
      <div className="mb-4 flex flex-col gap-1">
        <span className="text-sm font-medium text-text">{t('Password')}</span>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-color">
            {t('Password hidden for security')}
          </span>
          <Button
            label={t('Change')}
            severity="info"
            text
            size="small"
            onClick={onChangePassword}
            type="button"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <FormPasswordInput
        name="password"
        control={control}
        label={t('Password')}
        error={errors.password?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
      />
      {isExistingHost && hasPassword && isChangingPassword && (
        <Button
          label={t('Remove password')}
          className="-mt-3 mb-3 p-0"
          severity="danger"
          text
          size="small"
          onClick={onRemovePassword}
          type="button"
        />
      )}
    </>
  );
}
