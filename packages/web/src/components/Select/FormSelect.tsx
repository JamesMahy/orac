import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from 'react-hook-form';
import { Select } from './Select';

type SelectOption = {
  label: string;
  value: string;
};

type FormSelectProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: UseControllerProps<T, Path<T>>['rules'];
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  showError?: boolean;
  showDirtyState?: boolean;
  required?: boolean;
  disabled?: boolean;
};

export function FormSelect<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  options,
  placeholder,
  error,
  showError = true,
  showDirtyState = false,
  required,
  disabled,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Select
          id={field.name}
          label={label}
          value={field.value as string}
          onChange={field.onChange}
          onBlur={field.onBlur}
          options={options}
          placeholder={placeholder}
          error={showError ? error : undefined}
          required={required}
          disabled={disabled}
          dirty={showDirtyState && fieldState.isDirty}
        />
      )}
    />
  );
}
