export function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
  if (mimeType.startsWith('text/')) return 'pi pi-file-edit';
  if (mimeType.startsWith('audio/')) return 'pi pi-volume-up';
  if (mimeType.startsWith('video/')) return 'pi pi-video';
  return 'pi pi-file';
}
