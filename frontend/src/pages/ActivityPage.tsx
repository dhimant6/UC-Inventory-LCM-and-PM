import clsx from 'clsx';
import {
  Activity as ActivityIcon,
  Cable,
  FolderKanban,
  Hash,
  MonitorSmartphone,
  User as UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/shell';
import { FilterSelect } from '../components/toolbar';
import { Card, EmptyState, ErrorState, TableSkeleton } from '../components/ui';
import { api } from '../lib/api';
import { formatDateTime, timeAgo } from '../lib/format';
import { useFetch } from '../lib/useFetch';

const ENTITY_ICON = {
  device: MonitorSmartphone,
  number: Hash,
  project: FolderKanban,
  connector: Cable,
  user: UserIcon,
} as const;

export default function ActivityPage() {
  const activity = useFetch(() => api.activity(200), []);
  const [entity, setEntity] = useState('');

  const filtered = useMemo(
    () => (activity.data ?? []).filter((e) => !entity || e.entityType === entity),
    [activity.data, entity],
  );

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Audit trail of device, number, project and connector events."
        actions={
          <FilterSelect
            label="Entity"
            value={entity}
            onChange={setEntity}
            options={[
              { value: 'device', label: 'Devices' },
              { value: 'number', label: 'Numbers' },
              { value: 'project', label: 'Projects' },
              { value: 'connector', label: 'Connectors' },
              { value: 'user', label: 'Users' },
            ]}
          />
        }
      />

      {activity.loading && (
        <Card>
          <TableSkeleton rows={12} />
        </Card>
      )}
      {activity.error && (
        <Card>
          <ErrorState message={activity.error} onRetry={activity.reload} />
        </Card>
      )}
      {activity.data && !activity.loading && !activity.error && (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              title="No events for this entity type"
              hint="Try another filter — the audit log keeps the last 200 events."
            />
          ) : (
            <ol className="divide-y divide-line" aria-label="Activity log">
              {filtered.map((event) => {
                const Icon = ENTITY_ICON[event.entityType] ?? ActivityIcon;
                const isError = event.type === 'connector.error' || event.type === 'device.offline';
                return (
                  <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={clsx(
                        'mt-0.5 rounded-md p-1.5',
                        isError ? 'bg-crit/10 text-crit-ink' : 'bg-surface-2 text-ink-2',
                      )}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-1">{event.message}</p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {event.actor} · <span title={formatDateTime(event.at)}>{timeAgo(event.at)}</span>
                      </p>
                    </div>
                    <span className="tabular shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">
                      {event.type}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}
