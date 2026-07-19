import { ArrowRight, Bookmark } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CallQualityChart,
  ChartCard,
  StatusDistribution,
  TicketsChart,
  UptimeChart,
} from '../components/charts';
import { PageHeader } from '../components/shell';
import { Card, ErrorState, Skeleton, StatTile } from '../components/ui';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import { useFetch } from '../lib/useFetch';

const DeploymentHero = lazy(() => import('../components/hero3d'));

/**
 * Defer mounting heavy content until the browser is idle so the three.js
 * chunk never competes with first paint or blocks interactivity.
 */
function useIdleMount(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  return ready;
}

function savedViewHref(screen: string, filters: Record<string, string>): string {
  const params = new URLSearchParams(filters);
  return `/${screen}?${params.toString()}`;
}

export default function DashboardPage() {
  const heroReady = useIdleMount();
  const summary = useFetch(() => api.summary(), []);
  const callQuality = useFetch(() => api.callQuality(90), []);
  const uptime = useFetch(() => api.uptime(90), []);
  const tickets = useFetch(() => api.tickets(90), []);
  const activity = useFetch(() => api.activity(8), []);
  const savedViews = useFetch(() => api.savedViews(), []);
  const sites = useFetch(() => api.sites(), []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Estate health across every vendor, project and site."
      />

      {/* Stat tiles */}
      {summary.error ? (
        <Card className="mb-4">
          <ErrorState message={summary.error} onRetry={summary.reload} />
        </Card>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {summary.loading || !summary.data ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatTile
                label="Devices online"
                value={`${summary.data.devices.online}/${summary.data.devices.total}`}
                tone={summary.data.devices.offline > 10 ? 'warn' : 'ok'}
                detail={`${summary.data.devices.degraded} degraded · ${summary.data.devices.offline} offline`}
              />
              <StatTile
                label="Numbers assigned"
                value={summary.data.numbers.assigned}
                detail={`${summary.data.numbers.porting} porting · ${summary.data.numbers.unassigned} free`}
              />
              <StatTile
                label="Projects in flight"
                value={summary.data.projects.inFlight}
                tone={summary.data.projects.overdue > 0 ? 'crit' : 'default'}
                detail={
                  summary.data.projects.overdue > 0
                    ? `${summary.data.projects.overdue} overdue · ${summary.data.projects.blocked} blocked`
                    : `${summary.data.projects.planning} in planning`
                }
              />
              <StatTile label="Avg MOS today" value={summary.data.mosToday.toFixed(2)} detail="Across all vendors" />
              <StatTile
                label="Ticket backlog"
                value={summary.data.ticketBacklog}
                tone={summary.data.ticketBacklog > 30 ? 'warn' : 'default'}
                detail="Open UC support tickets"
              />
              <StatTile
                label="Sites"
                value={summary.data.sites}
                detail={`${summary.data.users} users worldwide`}
              />
            </>
          )}
        </div>
      )}

      {/* Hero: 3D deployment topology + device status */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          {heroReady ? (
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-none" />}>
              <DeploymentHero sites={sites.data ?? []} />
            </Suspense>
          ) : (
            <Skeleton className="h-72 w-full rounded-none" />
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink-1">Device status</h2>
            {summary.data ? (
              <div className="mt-3">
                <StatusDistribution
                  total={summary.data.devices.total}
                  segments={[
                    { label: 'Online', count: summary.data.devices.online, colorVar: '--ok' },
                    { label: 'Degraded', count: summary.data.devices.degraded, colorVar: '--warn' },
                    { label: 'Offline', count: summary.data.devices.offline, colorVar: '--crit' },
                  ]}
                />
              </div>
            ) : (
              <Skeleton className="mt-3 h-10" />
            )}
            <h2 className="mt-5 text-sm font-semibold text-ink-1">Number status</h2>
            {summary.data ? (
              <div className="mt-3">
                <StatusDistribution
                  total={summary.data.numbers.total}
                  segments={[
                    { label: 'Assigned', count: summary.data.numbers.assigned, colorVar: '--ok' },
                    { label: 'Unassigned', count: summary.data.numbers.unassigned, colorVar: '--line-2' },
                    { label: 'Reserved', count: summary.data.numbers.reserved, colorVar: '--accent' },
                    { label: 'Porting', count: summary.data.numbers.porting, colorVar: '--serious' },
                  ]}
                />
              </div>
            ) : (
              <Skeleton className="mt-3 h-10" />
            )}
          </Card>
          <Card className="flex-1 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-1">Saved views</h2>
              <Bookmark aria-hidden className="h-4 w-4 text-ink-3" />
            </div>
            <ul className="mt-2 space-y-1">
              {(savedViews.data ?? []).map((view) => (
                <li key={view.id}>
                  <Link
                    to={savedViewHref(view.screen, view.filters)}
                    className="micro group flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm text-ink-1 hover:bg-surface-2"
                  >
                    <span>
                      <span className="font-medium">{view.name}</span>
                      <span className="block text-xs text-ink-3">{view.description}</span>
                    </span>
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Time series */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title="Call quality (MOS)" subtitle="90-day average by vendor · higher is better">
          {callQuality.error ? (
            <ErrorState message={callQuality.error} onRetry={callQuality.reload} />
          ) : callQuality.data ? (
            <CallQualityChart points={callQuality.data} />
          ) : (
            <Skeleton className="h-full" />
          )}
        </ChartCard>
        <ChartCard title="Fleet uptime" subtitle="90-day daily uptime % by vendor">
          {uptime.error ? (
            <ErrorState message={uptime.error} onRetry={uptime.reload} />
          ) : uptime.data ? (
            <UptimeChart points={uptime.data} />
          ) : (
            <Skeleton className="h-full" />
          )}
        </ChartCard>
        <ChartCard title="Support tickets" subtitle="Opened vs resolved, with backlog trend">
          {tickets.error ? (
            <ErrorState message={tickets.error} onRetry={tickets.reload} />
          ) : tickets.data ? (
            <TicketsChart points={tickets.data} />
          ) : (
            <Skeleton className="h-full" />
          )}
        </ChartCard>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-1">Recent activity</h2>
          <Link to="/activity" className="micro text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {activity.error ? (
          <ErrorState message={activity.error} onRetry={activity.reload} />
        ) : activity.data ? (
          <ol className="divide-y divide-line">
            {activity.data.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate text-sm text-ink-1">{event.message}</span>
                <span className="shrink-0 text-xs text-ink-3">{timeAgo(event.at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
