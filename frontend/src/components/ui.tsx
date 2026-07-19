/**
 * UI primitives. Everything consumes design tokens through Tailwind's theme
 * mapping — no raw colors or one-off spacing in feature code.
 */
import clsx from 'clsx';
import { AlertTriangle, Inbox, RefreshCw, X } from 'lucide-react';
import { ButtonHTMLAttributes, HTMLAttributes, ReactNode, useEffect } from 'react';
import type { ConnectorStatus, DeviceStatus, NumberStatus, ProjectStatus } from '../lib/types';

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div aria-hidden className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'relative z-10 w-full animate-[modal-in_180ms_cubic-bezier(0,0,0.2,1)] rounded-lg border border-line bg-surface shadow-3',
          width,
        )}
      >
        <style>{`@keyframes modal-in{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink-1">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="micro rounded-sm p-1 text-ink-2 hover:bg-surface-2 hover:text-ink-1"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'micro h-9 w-full rounded-sm border border-line-2 bg-surface px-3 text-sm text-ink-1 placeholder:text-ink-3 focus:border-accent';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(inputClass, 'h-auto min-h-[4rem] py-2', props.className)}
    />
  );
}

/* ---------- Card ---------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-line bg-surface shadow-1',
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Button ---------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'micro inline-flex items-center justify-center gap-1.5 rounded-sm font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' &&
          'border border-line-2 bg-surface text-ink-1 hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
        variant === 'danger' && 'bg-crit text-on-accent hover:opacity-90',
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Status ---------- */

type AnyStatus = DeviceStatus | ProjectStatus | NumberStatus | ConnectorStatus;

const STATUS_STYLES: Record<AnyStatus, { dot: string; text: string; label: string }> = {
  online: { dot: 'bg-ok', text: 'text-ok-ink', label: 'Online' },
  degraded: { dot: 'bg-warn', text: 'text-warn-ink', label: 'Degraded' },
  offline: { dot: 'bg-crit', text: 'text-crit-ink', label: 'Offline' },
  planning: { dot: 'bg-ink-3', text: 'text-ink-2', label: 'Planning' },
  'in-flight': { dot: 'bg-accent', text: 'text-ink-1', label: 'In flight' },
  blocked: { dot: 'bg-crit', text: 'text-crit-ink', label: 'Blocked' },
  complete: { dot: 'bg-ok', text: 'text-ok-ink', label: 'Complete' },
  assigned: { dot: 'bg-ok', text: 'text-ok-ink', label: 'Assigned' },
  unassigned: { dot: 'bg-ink-3', text: 'text-ink-2', label: 'Unassigned' },
  reserved: { dot: 'bg-accent', text: 'text-ink-1', label: 'Reserved' },
  porting: { dot: 'bg-serious', text: 'text-serious-ink', label: 'Porting' },
  connected: { dot: 'bg-ok', text: 'text-ok-ink', label: 'Connected' },
  error: { dot: 'bg-crit', text: 'text-crit-ink', label: 'Error' },
  disabled: { dot: 'bg-ink-3', text: 'text-ink-2', label: 'Disabled' },
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-sm', style.text)}>
      <span aria-hidden className={clsx('h-2 w-2 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}

export function VendorBadge({ vendor }: { vendor: 'teams' | 'webex' | 'poly' }) {
  const map = {
    teams: { swatch: 'bg-s1', label: 'Teams' },
    webex: { swatch: 'bg-s2', label: 'Webex' },
    poly: { swatch: 'bg-s3', label: 'Poly' },
  } as const;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
      <span aria-hidden className={clsx('h-2.5 w-2.5 rounded-[3px]', map[vendor].swatch)} />
      {map[vendor].label}
    </span>
  );
}

/* ---------- Async states ---------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx('animate-pulse rounded-sm bg-surface-2', className)}
    />
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Inbox aria-hidden className="h-8 w-8 text-ink-3" />
      <p className="text-sm font-medium text-ink-1">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-2">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <AlertTriangle aria-hidden className="h-8 w-8 text-crit" />
      <p className="text-sm font-medium text-ink-1">Something went wrong</p>
      <p className="max-w-md text-sm text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

/* ---------- Stat tile ---------- */

export function StatTile({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  detail?: ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'crit';
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p
        className={clsx(
          'mt-1 text-2xl font-semibold',
          tone === 'default' && 'text-ink-1',
          tone === 'ok' && 'text-ok-ink',
          tone === 'warn' && 'text-warn-ink',
          tone === 'crit' && 'text-crit-ink',
        )}
      >
        {value}
      </p>
      {detail && <div className="mt-1 text-xs text-ink-2">{detail}</div>}
    </Card>
  );
}

/* ---------- Progress ---------- */

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  );
}
