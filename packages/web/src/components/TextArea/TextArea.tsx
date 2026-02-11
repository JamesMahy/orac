import { InputTextarea } from 'primereact/inputtextarea';

type TextAreaProps = {
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
  rows?: number;
  autoResize?: boolean;
  autoFocus?: boolean;
};

export function TextArea({
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
  rows = 3,
  autoResize = true,
  autoFocus,
}: TextAreaProps) {
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
      <InputTextarea
        id={id}
        value={value ?? ''}
        onChange={event => onChange?.(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        autoResize={autoResize}
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
