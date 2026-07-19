const DAY_MS = 86_400_000;

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "4m ago", "3h ago", "12d ago" — coarse on purpose. */
export function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return 'just now';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < DAY_MS) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / DAY_MS)}d ago`;
}

export function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / DAY_MS);
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatUsd(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/** +442012345678 → +44 20 1234 5678 (best-effort grouping for display). */
export function formatE164(e164: string): string {
  const match = e164.match(/^(\+\d{1,3})(\d{2,3})(\d{4})(\d+)$/);
  if (!match) return e164;
  return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}
