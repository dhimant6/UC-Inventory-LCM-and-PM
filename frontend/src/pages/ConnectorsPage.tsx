import { CheckCircle2, KeyRound, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/shell';
import { Button, Card, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { SyncResult, TestConnectionResult, Vendor } from '../lib/types';
import { useFetch } from '../lib/useFetch';

type ActionResult =
  | { kind: 'test'; result: TestConnectionResult }
  | { kind: 'sync'; result: SyncResult };

export default function ConnectorsPage() {
  const connectors = useFetch(() => api.connectors(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  const runTest = async (vendor: Vendor) => {
    setBusy(`test-${vendor}`);
    try {
      const result = await api.testConnection(vendor);
      setResults((r) => ({ ...r, [vendor]: { kind: 'test', result } }));
    } finally {
      setBusy(null);
    }
  };

  const runSync = async (vendor: Vendor) => {
    setBusy(`sync-${vendor}`);
    try {
      const result = await api.syncConnector(vendor);
      setResults((r) => ({ ...r, [vendor]: { kind: 'sync', result } }));
      connectors.reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Connectors"
        description={
          connectors.data
            ? `Data source: ${connectors.data.dataSource === 'mock' ? 'mock (seeded data — set DATA_SOURCE=live to use vendor APIs)' : 'live vendor APIs'}`
            : 'Vendor integrations and sync health.'
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('sync-all');
              try {
                await api.syncAll();
                connectors.reload();
              } finally {
                setBusy(null);
              }
            }}
          >
            <RefreshCw aria-hidden className={`h-3.5 w-3.5 ${busy === 'sync-all' ? 'animate-spin' : ''}`} />
            {busy === 'sync-all' ? 'Syncing all…' : 'Sync all'}
          </Button>
        }
      />

      {connectors.loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}
      {connectors.error && (
        <Card>
          <ErrorState message={connectors.error} onRetry={connectors.reload} />
        </Card>
      )}

      {connectors.data && !connectors.loading && !connectors.error && (
        <div className="grid gap-4 lg:grid-cols-3">
          {connectors.data.connectors.map((connector) => {
            const action = results[connector.id];
            return (
              <Card key={connector.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-ink-1">{connector.displayName}</h2>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {connector.source === 'mock' ? 'Mock data source' : 'Live API'}
                    </p>
                  </div>
                  <StatusBadge status={connector.status} />
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-2">Last sync</dt>
                    <dd className="text-ink-1">
                      {connector.lastSyncAt ? timeAgo(connector.lastSyncAt) : 'Never'}
                    </dd>
                  </div>
                  {connector.latencyMs !== null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">Latency</dt>
                      <dd className="tabular text-ink-1">{connector.latencyMs} ms</dd>
                    </div>
                  )}
                </dl>

                {connector.lastError && (
                  <div role="alert" className="mt-3 rounded-md border border-crit/40 bg-crit/10 px-3 py-2 text-sm text-crit-ink">
                    {connector.lastError}
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
                    <KeyRound aria-hidden className="h-3.5 w-3.5" /> Credentials
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {connector.credentials.map((cred) => (
                      <li key={cred.name} className="flex items-center justify-between gap-2 text-sm">
                        <code className="tabular text-xs text-ink-2">{cred.name}</code>
                        {cred.configured ? (
                          <span className="inline-flex items-center gap-1 text-xs text-ok-ink">
                            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> Set
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                            <XCircle aria-hidden className="h-3.5 w-3.5" /> Not set
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-ink-3">
                    Credentials are read from backend environment variables only.
                  </p>
                </div>

                {action && (
                  <div
                    role="status"
                    className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                      action.result.ok
                        ? 'border-ok/40 bg-ok/10 text-ok-ink'
                        : 'border-crit/40 bg-crit/10 text-crit-ink'
                    }`}
                  >
                    {action.kind === 'test'
                      ? action.result.ok
                        ? `Connection OK — ${action.result.deviceCount} devices in ${(action.result as TestConnectionResult).latencyMs} ms`
                        : `Test failed: ${action.result.error}`
                      : action.result.ok
                        ? `Synced ${action.result.deviceCount} devices`
                        : `Sync failed: ${action.result.error}`}
                  </div>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy !== null}
                    onClick={() => void runTest(connector.id)}
                  >
                    {busy === `test-${connector.id}` ? 'Testing…' : 'Test connection'}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busy !== null}
                    onClick={() => void runSync(connector.id)}
                  >
                    <RefreshCw
                      aria-hidden
                      className={`h-3.5 w-3.5 ${busy === `sync-${connector.id}` ? 'animate-spin' : ''}`}
                    />
                    {busy === `sync-${connector.id}` ? 'Syncing…' : 'Sync now'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
