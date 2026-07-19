import { PageHeader } from '../components/shell';
import { Column, DataTable } from '../components/table';
import {
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  TableSkeleton,
  VendorBadge,
} from '../components/ui';
import { api } from '../lib/api';
import { daysUntil, formatDate, formatUsd } from '../lib/format';
import type { License } from '../lib/types';
import { useFetch } from '../lib/useFetch';

export default function LicensesPage() {
  const licenses = useFetch(() => api.licenses(), []);

  const totalMonthly = (licenses.data ?? []).reduce(
    (sum, l) => sum + l.assigned * l.monthlyCostUsd,
    0,
  );

  const columns: Column<License>[] = [
    {
      key: 'name',
      header: 'Licence',
      primary: true,
      sortValue: (l) => l.displayName,
      render: (l) => (
        <div>
          <div className="font-medium">{l.displayName}</div>
          <div className="tabular text-xs text-ink-3">{l.sku}</div>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', sortValue: (l) => l.vendor, render: (l) => <VendorBadge vendor={l.vendor} /> },
    {
      key: 'usage',
      header: 'Seats used',
      sortValue: (l) => l.assigned / l.total,
      render: (l) => (
        <div className="flex w-44 items-center gap-2">
          <ProgressBar value={(l.assigned / l.total) * 100} label={`${l.displayName} seat usage`} />
          <span className="tabular shrink-0 text-xs text-ink-2">
            {l.assigned}/{l.total}
          </span>
        </div>
      ),
    },
    {
      key: 'renews',
      header: 'Renews',
      sortValue: (l) => l.renewsAt,
      render: (l) => {
        const days = daysUntil(l.renewsAt);
        return (
          <span className={days <= 45 ? 'font-medium text-warn-ink' : 'text-ink-2'}>
            {formatDate(l.renewsAt)} ({days}d)
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: 'Monthly cost',
      align: 'right',
      sortValue: (l) => l.assigned * l.monthlyCostUsd,
      render: (l) => formatUsd(l.assigned * l.monthlyCostUsd),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Licences"
        description={`Subscription entitlements across vendors — ${formatUsd(totalMonthly)}/month in assigned seats.`}
      />

      {licenses.loading && (
        <Card>
          <TableSkeleton rows={5} />
        </Card>
      )}
      {licenses.error && (
        <Card>
          <ErrorState message={licenses.error} onRetry={licenses.reload} />
        </Card>
      )}
      {licenses.data && !licenses.loading && !licenses.error && (
        <DataTable
          ariaLabel="Licences"
          rows={licenses.data}
          columns={columns}
          rowKey={(l) => l.id}
          emptyState={<EmptyState title="No licences on file" />}
        />
      )}
    </div>
  );
}
