/**
 * App shell: persistent sidebar navigation, top bar with global search
 * trigger, notifications and theme toggle. Collapses to a slide-over
 * sidebar below lg.
 */
import clsx from 'clsx';
import {
  Activity,
  Bell,
  Building2,
  Cable,
  FolderKanban,
  Hash,
  LayoutDashboard,
  Menu,
  MonitorSmartphone,
  Moon,
  Radio,
  ScrollText,
  Search,
  Sun,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import { useFetch } from '../lib/useFetch';
import { useTheme } from '../lib/theme';
import { CommandPalette } from './palette';
import { Button } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/devices', label: 'Devices', icon: MonitorSmartphone },
  { to: '/numbers', label: 'Phone numbers', icon: Hash },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/sites', label: 'Sites & rooms', icon: Building2 },
  { to: '/licenses', label: 'Licences', icon: ScrollText },
  { to: '/connectors', label: 'Connectors', icon: Cable },
  { to: '/activity', label: 'Activity', icon: Activity },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'micro flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium',
              isActive
                ? 'bg-accent-soft text-ink-1'
                : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
            )
          }
        >
          <Icon aria-hidden className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { data, reload } = useFetch(() => api.notifications(), []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell aria-hidden className="h-4 w-4" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-crit"
          />
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-80 overflow-hidden rounded-md border border-line bg-surface shadow-3">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-semibold text-ink-1">Notifications</span>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void api.markAllNotificationsRead().then(reload);
                }}
              >
                Mark all read
              </Button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {(data ?? []).map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <button
                  className="micro w-full px-3 py-2.5 text-left hover:bg-surface-2"
                  onClick={() => {
                    void api.markNotificationRead(n.id).then(reload);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className={clsx(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.severity === 'critical' && 'bg-crit',
                        n.severity === 'warning' && 'bg-warn',
                        n.severity === 'info' && 'bg-accent',
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={clsx(
                          'text-sm',
                          n.read ? 'text-ink-2' : 'font-medium text-ink-1',
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-ink-3">{timeAgo(n.at)}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (lg+) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface py-4 lg:flex">
        <div className="mb-4 flex items-center gap-2 px-6">
          <Radio aria-hidden className="h-5 w-5 text-accent" />
          <span className="text-base font-semibold text-ink-1">UC Inventory</span>
        </div>
        <SidebarNav />
        <p className="px-6 text-[11px] text-ink-3">
          Press <kbd className="rounded border border-line-2 px-1">⌘K</kbd> to search
        </p>
      </aside>

      {/* Slide-over sidebar (below lg) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-surface py-4">
            <div className="mb-4 flex items-center justify-between px-4">
              <span className="flex items-center gap-2 text-base font-semibold text-ink-1">
                <Radio aria-hidden className="h-5 w-5 text-accent" /> UC Inventory
              </span>
              <Button variant="ghost" size="sm" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>
                <X aria-hidden className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface px-4">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open menu"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu aria-hidden className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="micro flex h-9 w-full max-w-md items-center gap-2 rounded-sm border border-line-2 bg-surface px-3 text-sm text-ink-3 hover:border-accent"
          >
            <Search aria-hidden className="h-4 w-4" />
            <span className="flex-1 text-left">Search everything…</span>
            <kbd className="hidden rounded border border-line-2 px-1.5 text-[11px] sm:block">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <NotificationsMenu />
            <Button
              variant="ghost"
              size="sm"
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              onClick={toggle}
            >
              {theme === 'light' ? (
                <Moon aria-hidden className="h-4 w-4" />
              ) : (
                <Sun aria-hidden className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink-1">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
