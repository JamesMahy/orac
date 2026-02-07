import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from 'react-hook-form';
import { TextInput } from './TextInput';

type FormTextInputProps<T extends FieldValues> = {
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
  type?: 'text' | 'number';
  autoComplete?: string;
  autoFocus?: boolean;
};

export function FormTextInput<T extends FieldValues>({
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
  type = 'text',
  autoComplete,
  autoFocus,
}: FormTextInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextInput
          id={field.name}
          label={label}
          value={field.value as string}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          error={showError ? error : undefined}
          required={required}
          disabled={disabled}
          type={type}
          dirty={showDirtyState && fieldState.isDirty}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
      )}
    />
  );
}
