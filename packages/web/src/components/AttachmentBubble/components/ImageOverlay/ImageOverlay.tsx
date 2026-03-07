type ImageOverlayProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-label={alt}>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />
    </div>
  );
}
