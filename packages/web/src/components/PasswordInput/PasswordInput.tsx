import { useTranslation } from 'react-i18next';
import { Password } from 'primereact/password';

type PasswordInputProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  dirty?: boolean;
  autoComplete?: string;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  disabled,
  dirty,
  autoComplete,
}: PasswordInputProps) {
  const { t } = useTranslation('common', { keyPrefix: 'a11y' });
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="mb-4 flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required && (
            <>
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(required)</span>
            </>
          )}
          {dirty && (
            <span className="ml-2 text-xs text-primary">(modified)</span>
          )}
        </label>
      )}
      <Password
        inputId={id}
        value={value ?? ''}
        onChange={event => onChange?.(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        feedback={false}
        toggleMask
        invalid={!!error}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        pt={{
          showIcon: { 'aria-label': t('showPassword') },
          hideIcon: { 'aria-label': t('hidePassword') },
        }}
        className="[&_.p-icon-field]:w-full"
        inputClassName="w-full"
      />
      {error && (
        <small id={errorId} className="text-xs text-red-500" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
