/**
 * Top-bar sign-in control. Guest mode is the default — this only adds an
 * optional "Sign in" affordance and a signed-in user chip. Providers that
 * the backend hasn't configured are never shown, so the button hides itself
 * on a deployment without OAuth credentials.
 */
import clsx from 'clsx';
import { LogOut, UserCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from './ui';

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.3-5.7c-2 1.4-4.7 2.3-8.2 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg aria-hidden viewBox="0 0 21 21" className="h-4 w-4">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function AuthControl() {
  const { user, providers, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (loading || (!user && providers.length === 0)) return null;

  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={open}
          className="micro flex items-center gap-2 rounded-full border border-line-2 py-0.5 pl-0.5 pr-2.5 hover:bg-surface-2"
        >
          {user.picture ? (
            <img src={user.picture} alt="" className="h-6 w-6 rounded-full" />
          ) : (
            <UserCircle2 aria-hidden className="h-6 w-6 text-ink-3" />
          )}
          <span className="hidden max-w-[10rem] truncate text-sm text-ink-1 sm:block">{user.name}</span>
        </button>
        {open && (
          <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-3">
            <div className="border-b border-line px-3 py-2">
              <p className="truncate text-sm font-medium text-ink-1">{user.name}</p>
              <p className="truncate text-xs text-ink-2">{user.email}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="micro flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-1 hover:bg-surface-2"
            >
              <LogOut aria-hidden className="h-4 w-4 text-ink-3" /> Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open}>
        Sign in
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-md border border-line bg-surface p-1.5 shadow-3">
          {providers.map((p) => (
            <a
              key={p.id}
              href={`/api/auth/${p.id}`}
              className={clsx(
                'micro flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-ink-1 hover:bg-surface-2',
              )}
            >
              {p.id === 'google' ? <GoogleMark /> : <MicrosoftMark />}
              Continue with {p.label}
            </a>
          ))}
          <p className="px-3 py-1.5 text-[11px] text-ink-3">
            Signing in records your name, email and time.
          </p>
        </div>
      )}
    </div>
  );
}
