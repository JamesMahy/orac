type FormErrorProps = {
  message?: string | null;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      role="alert"
      aria-live="assertive">
      {message}
    </div>
  );
}
