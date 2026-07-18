/**
 * Command palette (⌘K / Ctrl+K): navigation commands plus live global search
 * across devices, numbers, projects, users and sites. Fully keyboard driven.
 */
import {
  Activity,
  Building2,
  Cable,
  FolderKanban,
  Hash,
  LayoutDashboard,
  MonitorSmartphone,
  Moon,
  Phone,
  ScrollText,
  Users as UsersIcon,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatE164 } from '../lib/format';
import { useTheme } from '../lib/theme';
import type { SearchResults } from '../lib/types';

interface PaletteItem {
  id: string;
  group: string;
  icon: ReactNode;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setActive(0);
      // Wait a frame so the element exists before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced global search.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      api
        .search(query)
        .then(setResults)
        .catch(() => setResults(null));
    }, 150);
    return () => clearTimeout(timer);
  }, [query, open]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (path: string) => () => {
      onClose();
      navigate(path);
    };
    const nav: PaletteItem[] = [
      { id: 'nav-dash', group: 'Go to', icon: <LayoutDashboard aria-hidden className="h-4 w-4" />, label: 'Dashboard', run: go('/') },
      { id: 'nav-projects', group: 'Go to', icon: <FolderKanban aria-hidden className="h-4 w-4" />, label: 'Projects', run: go('/projects') },
      { id: 'nav-devices', group: 'Go to', icon: <MonitorSmartphone aria-hidden className="h-4 w-4" />, label: 'Devices', run: go('/devices') },
      { id: 'nav-numbers', group: 'Go to', icon: <Hash aria-hidden className="h-4 w-4" />, label: 'Phone numbers', run: go('/numbers') },
      { id: 'nav-users', group: 'Go to', icon: <UsersIcon aria-hidden className="h-4 w-4" />, label: 'Users', run: go('/users') },
      { id: 'nav-sites', group: 'Go to', icon: <Building2 aria-hidden className="h-4 w-4" />, label: 'Sites & rooms', run: go('/sites') },
      { id: 'nav-licenses', group: 'Go to', icon: <ScrollText aria-hidden className="h-4 w-4" />, label: 'Licences', run: go('/licenses') },
      { id: 'nav-connectors', group: 'Go to', icon: <Cable aria-hidden className="h-4 w-4" />, label: 'Connectors', run: go('/connectors') },
      { id: 'nav-activity', group: 'Go to', icon: <Activity aria-hidden className="h-4 w-4" />, label: 'Activity', run: go('/activity') },
      {
        id: 'cmd-theme',
        group: 'Commands',
        icon: <Moon aria-hidden className="h-4 w-4" />,
        label: 'Toggle dark mode',
        run: () => {
          toggle();
          onClose();
        },
      },
    ];
    const q = query.trim().toLowerCase();
    const filteredNav = q
      ? nav.filter((i) => i.label.toLowerCase().includes(q))
      : nav;

    const searchItems: PaletteItem[] = [];
    if (results) {
      for (const d of results.devices) {
        searchItems.push({
          id: `dev-${d.id}`,
          group: 'Devices',
          icon: <MonitorSmartphone aria-hidden className="h-4 w-4" />,
          label: d.name,
          hint: d.serialNumber,
          run: go(`/devices?q=${encodeURIComponent(d.serialNumber)}`),
        });
      }
      for (const n of results.numbers) {
        searchItems.push({
          id: `num-${n.id}`,
          group: 'Numbers',
          icon: <Phone aria-hidden className="h-4 w-4" />,
          label: formatE164(n.e164),
          hint: n.carrier,
          run: go(`/numbers?q=${encodeURIComponent(n.e164)}`),
        });
      }
      for (const p of results.projects) {
        searchItems.push({
          id: `proj-${p.id}`,
          group: 'Projects',
          icon: <FolderKanban aria-hidden className="h-4 w-4" />,
          label: p.name,
          hint: p.client,
          run: go(`/projects?q=${encodeURIComponent(p.name)}`),
        });
      }
      for (const u of results.users) {
        searchItems.push({
          id: `user-${u.id}`,
          group: 'Users',
          icon: <UsersIcon aria-hidden className="h-4 w-4" />,
          label: u.displayName,
          hint: u.email,
          run: go(`/users?q=${encodeURIComponent(u.displayName)}`),
        });
      }
      for (const s of results.sites) {
        searchItems.push({
          id: `site-${s.id}`,
          group: 'Sites',
          icon: <Building2 aria-hidden className="h-4 w-4" />,
          label: s.name,
          hint: s.city,
          run: go('/sites'),
        });
      }
    }
    return [...searchItems, ...filteredNav];
  }, [query, results, navigate, onClose, toggle]);

  useEffect(() => {
    setActive(0);
  }, [items.length, query]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      items[active].run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div aria-hidden className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="absolute left-1/2 top-[15vh] w-full max-w-xl -translate-x-1/2 animate-[palette-in_180ms_cubic-bezier(0,0,0.2,1)] overflow-hidden rounded-lg border border-line bg-surface shadow-3"
      >
        <style>{`@keyframes palette-in { from { transform: translate(-50%, -8px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[active]?.id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search devices, numbers, projects… or jump to a page"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-ink-1 outline-none placeholder:text-ink-3"
        />
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-ink-2">No matches</li>
          )}
          {items.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {showGroup && (
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                    {item.group}
                  </div>
                )}
                <button
                  id={item.id}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={item.run}
                  className={`micro flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm ${
                    index === active ? 'bg-accent-soft text-ink-1' : 'text-ink-1'
                  }`}
                >
                  <span className="text-ink-3">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-ink-3">{item.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line px-4 py-2 text-[11px] text-ink-3">
          ↑↓ navigate · Enter select · Esc close
        </div>
      </div>
    </div>
  );
}
