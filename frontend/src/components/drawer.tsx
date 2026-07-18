import { X } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';
import { Button } from './ui';

/**
 * Right-hand detail drawer. Focus moves in on open, Escape closes, and the
 * dialog role/label keep it accessible. Entry animation is transform/opacity
 * only and respects prefers-reduced-motion via the global override.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg animate-[drawer-in_200ms_cubic-bezier(0,0,0.2,1)] flex-col border-l border-line bg-surface shadow-3"
      >
        <style>{`@keyframes drawer-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="truncate text-base font-semibold text-ink-1">{title}</h2>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X aria-hidden className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function DrawerField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-1">{children}</dd>
    </div>
  );
}
