type LoadingSpinnerProps = {
  isLoading: boolean;
  className?: string;
};

export function LoadingSpinner({ isLoading, className }: LoadingSpinnerProps) {
  if (!isLoading) return null;

  return (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      role="status"
      aria-live="polite">
      <i className="pi pi-spin pi-spinner text-2xl" aria-hidden="true" />
    </div>
  );
}
