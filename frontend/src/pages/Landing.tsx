/**
 * Default gate shown before the app. Two paths: sign in with Google/Microsoft
 * (framed as connecting real vendor data), or continue as a named guest into
 * the seeded demo. Purely a soft gate — the demo needs no account.
 */
import { ArrowRight, Radio } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { GoogleMark, MicrosoftMark } from '../components/auth';
import { Button } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

const HIGHLIGHTS = [
  '150 devices across Teams, Webex & Poly',
  '400 phone numbers · 8 projects · 90-day analytics',
  'Connector health, saved views & audit log',
];

export default function Landing() {
  const { providers, continueAsGuest } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState('');

  const onDemo = (e: FormEvent) => {
    e.preventDefault();
    continueAsGuest(name);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-page px-4 py-10">
      {/* Soft accent wash, transform/opacity only — no layout cost. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--accent), transparent)' }}
      />

      <div className="relative grid w-full max-w-4xl gap-8 md:grid-cols-2 md:items-center">
        {/* Pitch */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Radio aria-hidden className="h-6 w-6 text-accent" />
            <span className="text-lg font-semibold text-ink-1">Fleetline</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-ink-1">
            The management console for unified-comms deployments.
          </h1>
          <p className="mt-3 text-sm text-ink-2">
            Track projects, devices and phone numbers across Microsoft Teams, Cisco Webex and
            Poly — one normalized view over every vendor.
          </p>
          <ul className="mt-5 space-y-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-ink-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Gate card */}
        <div className="rounded-lg border border-line bg-surface p-6 shadow-2">
          {providers.length > 0 && (
            <>
              <p className="text-sm font-medium text-ink-1">Sign in for real-world use</p>
              <p className="mt-1 text-xs text-ink-2">
                Connect your own Teams, Webex or Poly tenants and manage live inventory.
              </p>
              <div className="mt-3 space-y-2">
                {providers.map((p) => (
                  <a
                    key={p.id}
                    href={`/api/auth/${p.id}`}
                    className="micro flex h-10 items-center justify-center gap-2.5 rounded-sm border border-line-2 bg-surface text-sm font-medium text-ink-1 hover:bg-surface-2"
                  >
                    {p.id === 'google' ? <GoogleMark /> : <MicrosoftMark />}
                    Continue with {p.label}
                  </a>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-3">
                Signing in records your name, email and time.
              </p>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11px] uppercase tracking-wide text-ink-3">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <form onSubmit={onDemo}>
            <label htmlFor="guest-name" className="text-sm font-medium text-ink-1">
              Explore the demo
            </label>
            <p className="mt-1 text-xs text-ink-2">
              Jump into a fully populated environment with seeded data — no account needed.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="guest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="micro h-10 flex-1 rounded-sm border border-line-2 bg-surface px-3 text-sm text-ink-1 placeholder:text-ink-3 focus:border-accent"
              />
              <Button type="submit" variant="primary" className="h-10 shrink-0 px-4">
                Continue <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <p className="absolute bottom-4 text-[11px] text-ink-3">
        {theme === 'dark' ? 'Dark' : 'Light'} theme · demo data regenerates on each restart
      </p>
    </div>
  );
}
