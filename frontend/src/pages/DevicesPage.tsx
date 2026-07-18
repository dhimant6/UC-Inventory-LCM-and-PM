import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drawer, DrawerField } from '../components/drawer';
import { PageHeader } from '../components/shell';
import { Column, DataTable } from '../components/table';
import { ActiveFilterChips, FilterSelect, SearchInput } from '../components/toolbar';
import {
  Button,
  EmptyState,
  ErrorState,
  ProgressBar,
  StatusBadge,
  TableSkeleton,
  VendorBadge,
} from '../components/ui';
import { api } from '../lib/api';
import { formatDateTime, formatE164, timeAgo } from '../lib/format';
import type { Device, DeviceDetail } from '../lib/types';
import { useFetch } from '../lib/useFetch';

function DeviceDrawer({ deviceId, onClose }: { deviceId: string | null; onClose: () => void }) {
  const { data, loading, error, reload } = useFetch<DeviceDetail | null>(
    () => (deviceId ? api.device(deviceId) : Promise.resolve(null)),
    [deviceId],
  );

  return (
    <Drawer open={deviceId !== null} onClose={onClose} title={data?.name ?? 'Device'}>
      {loading && <TableSkeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && !loading && !error && (
        <dl className="divide-y divide-line">
          <DrawerField label="Status">
            <StatusBadge status={data.status} />
          </DrawerField>
          <DrawerField label="Vendor">
            <VendorBadge vendor={data.vendor} />
          </DrawerField>
          <DrawerField label="Model">{data.model}</DrawerField>
          <DrawerField label="Serial number">
            <span className="tabular">{data.serialNumber}</span>
          </DrawerField>
          <DrawerField label="MAC / IP">
            <span className="tabular">
              {data.macAddress}
              {data.ipAddress ? ` · ${data.ipAddress}` : ''}
            </span>
          </DrawerField>
          <DrawerField label="Firmware">{data.firmwareVersion}</DrawerField>
          <DrawerField label="Last seen">{formatDateTime(data.lastSeenAt)}</DrawerField>
          <DrawerField label="Location">
            {data.site ? `${data.site.name}${data.room ? ` · ${data.room.name}` : ''}` : '—'}
          </DrawerField>
          <DrawerField label="Project">{data.project?.name ?? 'Unassigned'}</DrawerField>
          {data.numbers.length > 0 && (
            <DrawerField label="Phone numbers">
              {data.numbers.map((n) => (
                <div key={n.id} className="tabular">
                  {formatE164(n.e164)}
                </div>
              ))}
            </DrawerField>
          )}
          {data.health && (
            <DrawerField label={`Health score · ${data.health.score}/100`}>
              <ProgressBar value={data.health.score} label="Health score" />
              {data.health.issues.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-sm text-crit-ink">
                  {data.health.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ok-ink">No issues reported</p>
              )}
              {data.health.uptimeHours > 0 && (
                <p className="mt-2 text-xs text-ink-2">
                  CPU {data.health.cpuPct}% · Memory {data.health.memoryPct}% ·{' '}
                  {data.health.temperatureC}°C · Up {Math.round(data.health.uptimeHours / 24)}d
                </p>
              )}
            </DrawerField>
          )}
        </dl>
      )}
    </Drawer>
  );
}

function exportCsv(devices: Device[], keys: string[]): void {
  const rows = devices.filter((d) => keys.includes(d.id));
  const header = 'name,vendor,model,serial,mac,ip,firmware,status,lastSeen';
  const body = rows
    .map((d) =>
      [d.name, d.vendor, d.model, d.serialNumber, d.macAddress, d.ipAddress, d.firmwareVersion, d.status, d.lastSeenAt]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'devices.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DevicesPage() {
  const devices = useFetch(() => api.devices(), []);
  const sites = useFetch(() => api.sites(), []);
  const [params, setParams] = useSearchParams();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const q = params.get('q') ?? '';
  const vendor = params.get('vendor') ?? '';
  const status = params.get('status') ?? '';
  const site = params.get('site') ?? '';
  const tag = params.get('tag') ?? '';

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

  const filtered = useMemo(() => {
    const list = devices.data ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter(
      (d) =>
        (!needle ||
          [d.name, d.model, d.serialNumber, d.macAddress, d.ipAddress].some((f) =>
            f.toLowerCase().includes(needle),
          )) &&
        (!vendor || d.vendor === vendor) &&
        (!status || d.status === status) &&
        (!site || d.siteId === site) &&
        (!tag || d.tags.includes(tag)),
    );
  }, [devices.data, q, vendor, status, site, tag]);

  const siteName = (id: string) => sites.data?.find((s) => s.id === id)?.name ?? '—';

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Device',
      primary: true,
      sortValue: (d) => d.name,
      render: (d) => (
        <div>
          <div className="font-medium">{d.name}</div>
          <div className="text-xs text-ink-3">{d.model}</div>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', sortValue: (d) => d.vendor, render: (d) => <VendorBadge vendor={d.vendor} /> },
    { key: 'status', header: 'Status', sortValue: (d) => d.status, render: (d) => <StatusBadge status={d.status} /> },
    { key: 'site', header: 'Site', sortValue: (d) => siteName(d.siteId), render: (d) => siteName(d.siteId) },
    {
      key: 'serial',
      header: 'Serial',
      sortValue: (d) => d.serialNumber,
      render: (d) => <span className="tabular text-ink-2">{d.serialNumber}</span>,
    },
    {
      key: 'firmware',
      header: 'Firmware',
      defaultHidden: true,
      sortValue: (d) => d.firmwareVersion,
      render: (d) => <span className="tabular text-ink-2">{d.firmwareVersion}</span>,
    },
    {
      key: 'mac',
      header: 'MAC',
      defaultHidden: true,
      render: (d) => <span className="tabular text-ink-2">{d.macAddress}</span>,
    },
    {
      key: 'ip',
      header: 'IP address',
      defaultHidden: true,
      sortValue: (d) => d.ipAddress,
      render: (d) => <span className="tabular text-ink-2">{d.ipAddress}</span>,
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      sortValue: (d) => d.lastSeenAt,
      render: (d) => <span className="text-ink-2">{timeAgo(d.lastSeenAt)}</span>,
    },
  ];

  const chips = [
    vendor && { key: 'vendor', label: `Vendor: ${vendor}`, onRemove: () => setParam('vendor', '') },
    status && { key: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') },
    site && { key: 'site', label: `Site: ${siteName(site)}`, onRemove: () => setParam('site', '') },
    tag && { key: 'tag', label: `Tag: ${tag}`, onRemove: () => setParam('tag', '') },
  ].filter((c): c is { key: string; label: string; onRemove: () => void } => Boolean(c));

  return (
    <div>
      <PageHeader
        title="Devices"
        description="Every endpoint across Teams, Webex and Poly, normalized into one inventory."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(v) => setParam('q', v)} placeholder="Search name, serial, MAC, IP…" />
        <FilterSelect
          label="Vendor"
          value={vendor}
          onChange={(v) => setParam('vendor', v)}
          options={[
            { value: 'teams', label: 'Teams' },
            { value: 'webex', label: 'Webex' },
            { value: 'poly', label: 'Poly' },
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setParam('status', v)}
          options={[
            { value: 'online', label: 'Online' },
            { value: 'degraded', label: 'Degraded' },
            { value: 'offline', label: 'Offline' },
          ]}
        />
        <FilterSelect
          label="Site"
          value={site}
          onChange={(v) => setParam('site', v)}
          options={(sites.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
      <div className="mb-3">
        <ActiveFilterChips chips={chips} onClear={() => setParams({}, { replace: true })} />
      </div>

      {devices.loading && (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={10} />
        </div>
      )}
      {devices.error && (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState message={devices.error} onRetry={devices.reload} />
        </div>
      )}
      {devices.data && !devices.loading && !devices.error && (
        <DataTable
          ariaLabel="Devices"
          rows={filtered}
          columns={columns}
          rowKey={(d) => d.id}
          onRowClick={(d) => setSelectedDevice(d.id)}
          emptyState={
            <EmptyState
              title="No devices match these filters"
              hint="Try removing a filter, or clear them all to see the full inventory."
              action={
                <Button size="sm" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
              }
            />
          }
          bulkActions={(keys, clear) => (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  exportCsv(devices.data ?? [], keys);
                  clear();
                }}
              >
                <Download aria-hidden className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </>
          )}
        />
      )}

      <DeviceDrawer deviceId={selectedDevice} onClose={() => setSelectedDevice(null)} />
    </div>
  );
}
