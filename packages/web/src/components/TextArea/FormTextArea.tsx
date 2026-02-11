import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from 'react-hook-form';
import { TextArea } from './TextArea';

type FormTextAreaProps<T extends FieldValues> = {
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
  rows?: number;
  autoResize?: boolean;
  autoFocus?: boolean;
};

export function FormTextArea<T extends FieldValues>({
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
  rows,
  autoResize,
  autoFocus,
}: FormTextAreaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextArea
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
          rows={rows}
          autoResize={autoResize}
          autoFocus={autoFocus}
        />
      )}
    />
  );
}
