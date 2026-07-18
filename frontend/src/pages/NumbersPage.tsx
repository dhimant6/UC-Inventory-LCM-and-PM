import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drawer, DrawerField } from '../components/drawer';
import { PageHeader } from '../components/shell';
import { Column, DataTable } from '../components/table';
import { ActiveFilterChips, FilterSelect, SearchInput } from '../components/toolbar';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  StatusBadge,
  TableSkeleton,
} from '../components/ui';
import { api } from '../lib/api';
import { formatDate, formatE164 } from '../lib/format';
import type { PhoneNumber } from '../lib/types';
import { useFetch } from '../lib/useFetch';

const COUNTRY_LABELS: Record<string, string> = {
  GB: 'United Kingdom',
  US: 'United States',
  DE: 'Germany',
  SG: 'Singapore',
  AU: 'Australia',
  CA: 'Canada',
};

export default function NumbersPage() {
  const numbers = useFetch(() => api.numbers(), []);
  const ranges = useFetch(() => api.numberRanges(), []);
  const users = useFetch(() => api.users(), []);
  const devices = useFetch(() => api.devices(), []);
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<PhoneNumber | null>(null);

  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const country = params.get('country') ?? '';
  const carrier = params.get('carrier') ?? '';

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const userName = (id?: string) => users.data?.find((u) => u.id === id)?.displayName;
  const deviceName = (id?: string) => devices.data?.find((d) => d.id === id)?.name;
  const assignee = (n: PhoneNumber) => userName(n.assignedUserId) ?? deviceName(n.assignedDeviceId) ?? '—';

  const carriers = useMemo(
    () => [...new Set((numbers.data ?? []).map((n) => n.carrier))].sort(),
    [numbers.data],
  );

  const filtered = useMemo(() => {
    const list = numbers.data ?? [];
    const needle = q.replace(/[^+\d]/g, '');
    return list.filter(
      (n) =>
        (!needle || n.e164.includes(needle)) &&
        (!status || n.status === status) &&
        (!country || n.country === country) &&
        (!carrier || n.carrier === carrier),
    );
  }, [numbers.data, q, status, country, carrier]);

  const columns: Column<PhoneNumber>[] = [
    {
      key: 'e164',
      header: 'Number',
      primary: true,
      sortValue: (n) => n.e164,
      render: (n) => <span className="tabular font-medium">{formatE164(n.e164)}</span>,
    },
    { key: 'status', header: 'Status', sortValue: (n) => n.status, render: (n) => <StatusBadge status={n.status} /> },
    {
      key: 'country',
      header: 'Country',
      sortValue: (n) => n.country,
      render: (n) => COUNTRY_LABELS[n.country] ?? n.country,
    },
    { key: 'carrier', header: 'Carrier', sortValue: (n) => n.carrier, render: (n) => <span className="text-ink-2">{n.carrier}</span> },
    { key: 'assignee', header: 'Assigned to', sortValue: (n) => assignee(n), render: (n) => assignee(n) },
    {
      key: 'range',
      header: 'DID range',
      defaultHidden: true,
      render: (n) => (
        <span className="text-ink-2">{ranges.data?.find((r) => r.id === n.rangeId)?.label ?? n.rangeId}</span>
      ),
    },
    {
      key: 'porting',
      header: 'Port date',
      defaultHidden: true,
      sortValue: (n) => n.portingTargetDate ?? '',
      render: (n) => (n.portingTargetDate ? formatDate(n.portingTargetDate) : '—'),
    },
  ];

  const chips = [
    status && { key: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') },
    country && { key: 'country', label: `Country: ${COUNTRY_LABELS[country] ?? country}`, onRemove: () => setParam('country', '') },
    carrier && { key: 'carrier', label: `Carrier: ${carrier}`, onRemove: () => setParam('carrier', '') },
  ].filter((c): c is { key: string; label: string; onRemove: () => void } => Boolean(c));

  return (
    <div>
      <PageHeader
        title="Phone numbers"
        description="DID inventory across carriers and countries, with assignment and porting state."
      />

      {/* DID ranges strip */}
      {ranges.data && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ranges.data.map((r) => (
            <Card key={r.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink-1">{r.label}</p>
                <span className="tabular shrink-0 text-xs text-ink-3">{r.size} DIDs</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-2">
                {r.carrier} · <span className="tabular">{r.assigned}</span> assigned
                {r.porting > 0 && (
                  <span className="text-serious-ink"> · {r.porting} porting</span>
                )}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(v) => setParam('q', v)} placeholder="Search number…" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setParam('status', v)}
          options={[
            { value: 'assigned', label: 'Assigned' },
            { value: 'unassigned', label: 'Unassigned' },
            { value: 'reserved', label: 'Reserved' },
            { value: 'porting', label: 'Porting' },
          ]}
        />
        <FilterSelect
          label="Country"
          value={country}
          onChange={(v) => setParam('country', v)}
          options={Object.entries(COUNTRY_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          label="Carrier"
          value={carrier}
          onChange={(v) => setParam('carrier', v)}
          options={carriers.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <div className="mb-3">
        <ActiveFilterChips chips={chips} onClear={() => setParams({}, { replace: true })} />
      </div>

      {numbers.loading && (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={10} />
        </div>
      )}
      {numbers.error && (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState message={numbers.error} onRetry={numbers.reload} />
        </div>
      )}
      {numbers.data && !numbers.loading && !numbers.error && (
        <DataTable
          ariaLabel="Phone numbers"
          rows={filtered}
          columns={columns}
          rowKey={(n) => n.id}
          onRowClick={setSelected}
          pageSize={50}
          emptyState={
            <EmptyState
              title="No numbers match these filters"
              hint="Try widening the status or country filters."
              action={
                <Button size="sm" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
              }
            />
          }
          bulkActions={(keys, clear) => (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const rows = (numbers.data ?? []).filter((n) => keys.includes(n.id));
                const csv = ['e164,status,country,carrier']
                  .concat(rows.map((n) => `${n.e164},${n.status},${n.country},"${n.carrier}"`))
                  .join('\n');
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'numbers.csv';
                a.click();
                URL.revokeObjectURL(url);
                clear();
              }}
            >
              <Download aria-hidden className="h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        />
      )}

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? formatE164(selected.e164) : 'Number'}
      >
        {selected && (
          <dl className="divide-y divide-line">
            <DrawerField label="Status">
              <StatusBadge status={selected.status} />
            </DrawerField>
            <DrawerField label="Country">{COUNTRY_LABELS[selected.country] ?? selected.country}</DrawerField>
            <DrawerField label="Carrier">{selected.carrier}</DrawerField>
            <DrawerField label="DID range">
              {ranges.data?.find((r) => r.id === selected.rangeId)?.label ?? selected.rangeId}
            </DrawerField>
            <DrawerField label="Assigned to">{assignee(selected)}</DrawerField>
            {selected.portingTargetDate && (
              <DrawerField label="Porting completes">{formatDate(selected.portingTargetDate)}</DrawerField>
            )}
          </dl>
        )}
      </Drawer>
    </div>
  );
}
