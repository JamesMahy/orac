import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import clsx from 'clsx';

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  dirty?: boolean;
};

export function Select({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
  required,
  disabled,
  dirty,
}: SelectProps) {
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
      <Dropdown
        inputId={id}
        value={value}
        onChange={(event: DropdownChangeEvent) => onChange?.(event.value as string)}
        onBlur={onBlur}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={clsx(
          'w-full rounded-lg border text-sm',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-border focus:ring-primary',
        )}
      />
      {error && (
        <small id={errorId} className="text-xs text-red-500" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
