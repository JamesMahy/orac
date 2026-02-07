import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from 'react-hook-form';
import { PasswordInput } from './PasswordInput';

type FormPasswordInputProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: UseControllerProps<T, Path<T>>['rules'];
  label: string;
  placeholder?: string;
  error?: string;
  showError?: boolean;
  showDirtyState?: boolean;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
};

export function FormPasswordInput<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  placeholder,
  error,
  showError = true,
  showDirtyState = false,
  required,
  disabled,
  autoComplete,
}: FormPasswordInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <PasswordInput
          id={field.name}
          label={label}
          value={field.value as string}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          error={showError ? error : undefined}
          required={required}
          disabled={disabled}
          dirty={showDirtyState && fieldState.isDirty}
          autoComplete={autoComplete}
        />
      )}
    />
  );
}
