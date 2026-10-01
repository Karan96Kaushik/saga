export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function fileDisplayName(name: string): string {
  const cleaned = name.replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || 'Untitled file').slice(0, 200);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}
