export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatAggregateSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s";
  const kb = bytesPerSec / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${Math.round(kb)} KB/s`;
}
