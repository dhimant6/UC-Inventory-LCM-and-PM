import clsx from 'clsx';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/shell';
import { Card, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { useFetch } from '../lib/useFetch';

export default function SitesPage() {
  const sites = useFetch(() => api.sites(), []);
  const rooms = useFetch(() => api.rooms(), []);
  const [activeSite, setActiveSite] = useState<string | null>(null);

  const selected = activeSite ?? sites.data?.[0]?.id ?? null;
  const siteRooms = (rooms.data ?? []).filter((r) => r.siteId === selected);

  return (
    <div>
      <PageHeader
        title="Sites & rooms"
        description="Physical estate: offices, meeting rooms, and the devices installed in them."
      />

      {sites.loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {sites.error && (
        <Card>
          <ErrorState message={sites.error} onRetry={sites.reload} />
        </Card>
      )}

      {sites.data && !sites.loading && !sites.error && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="tablist" aria-label="Sites">
            {sites.data.map((site) => (
              <button
                key={site.id}
                role="tab"
                aria-selected={selected === site.id}
                onClick={() => setActiveSite(site.id)}
                className="text-left"
              >
                <Card
                  className={clsx(
                    'micro h-full px-4 py-3 hover:shadow-2',
                    selected === site.id && 'border-accent',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-1">
                        <Building2 aria-hidden className="h-4 w-4 text-ink-3" />
                        {site.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-2">
                        {site.city}, {site.country} · {site.timezone}
                      </p>
                    </div>
                    {site.offlineCount > 0 && (
                      <span className="rounded-full bg-crit px-1.5 py-0.5 text-[11px] font-semibold text-on-accent">
                        {site.offlineCount} offline
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 flex gap-4 text-xs text-ink-2">
                    <div>
                      <dt className="sr-only">Rooms</dt>
                      <dd>
                        <span className="tabular font-semibold text-ink-1">{site.roomCount}</span> rooms
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Devices</dt>
                      <dd>
                        <span className="tabular font-semibold text-ink-1">{site.deviceCount}</span> devices
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Users</dt>
                      <dd>
                        <span className="tabular font-semibold text-ink-1">{site.userCount}</span> users
                      </dd>
                    </div>
                  </dl>
                </Card>
              </button>
            ))}
          </div>

          <h2 className="mb-3 mt-8 text-base font-semibold text-ink-1">
            Rooms — {sites.data.find((s) => s.id === selected)?.name}
          </h2>
          {rooms.loading && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          )}
          {rooms.error && (
            <Card>
              <ErrorState message={rooms.error} onRetry={rooms.reload} />
            </Card>
          )}
          {rooms.data && siteRooms.length === 0 && !rooms.loading && (
            <Card>
              <EmptyState title="No rooms at this site" hint="Rooms appear when the vendor workspace sync maps them here." />
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {siteRooms.map((room) => (
              <Card key={room.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-1">{room.name}</p>
                  <span className="shrink-0 text-xs text-ink-3">Seats {room.capacity}</span>
                </div>
                {room.devices.length === 0 ? (
                  <p className="mt-2 text-xs text-ink-3">No devices installed</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {room.devices.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-ink-2">{d.model}</span>
                        <StatusBadge status={d.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
