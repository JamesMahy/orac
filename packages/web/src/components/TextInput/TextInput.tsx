import { InputText } from 'primereact/inputtext';

type TextInputProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'number';
  dirty?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
};

export function TextInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  disabled,
  type = 'text',
  dirty,
  autoComplete,
  autoFocus,
}: TextInputProps) {
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
      <InputText
        id={id}
        value={value ?? ''}
        onChange={event => onChange?.(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        invalid={!!error}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className="w-full"
      />
      {error && (
        <small id={errorId} className="text-xs text-red-500" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
