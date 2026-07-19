import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/shell';
import { Column, DataTable } from '../components/table';
import { FilterSelect, SearchInput } from '../components/toolbar';
import { Button, EmptyState, ErrorState, TableSkeleton } from '../components/ui';
import { api } from '../lib/api';
import type { User } from '../lib/types';
import { useFetch } from '../lib/useFetch';

export default function UsersPage() {
  const users = useFetch(() => api.users(), []);
  const sites = useFetch(() => api.sites(), []);
  const licenses = useFetch(() => api.licenses(), []);
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const site = params.get('site') ?? '';

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

  const siteName = (id: string) => sites.data?.find((s) => s.id === id)?.name ?? '—';
  const licenseNames = (ids: string[]) =>
    ids
      .map((id) => licenses.data?.find((l) => l.id === id)?.displayName)
      .filter(Boolean)
      .join(', ') || '—';

  const filtered = useMemo(() => {
    const list = users.data ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter(
      (u) =>
        (!needle ||
          [u.displayName, u.email, u.title].some((f) => f.toLowerCase().includes(needle))) &&
        (!site || u.siteId === site),
    );
  }, [users.data, q, site]);

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      primary: true,
      sortValue: (u) => u.displayName,
      render: (u) => (
        <div>
          <div className="font-medium">{u.displayName}</div>
          <div className="text-xs text-ink-3">{u.email}</div>
        </div>
      ),
    },
    { key: 'title', header: 'Title', sortValue: (u) => u.title, render: (u) => <span className="text-ink-2">{u.title}</span> },
    { key: 'site', header: 'Site', sortValue: (u) => siteName(u.siteId), render: (u) => siteName(u.siteId) },
    { key: 'licenses', header: 'Licences', render: (u) => <span className="text-ink-2">{licenseNames(u.licenseIds)}</span> },
    { key: 'numbers', header: 'Numbers', align: 'right', sortValue: (u) => u.numberCount, render: (u) => u.numberCount },
  ];

  return (
    <div>
      <PageHeader title="Users" description="Directory of people with UC entitlements and assignments." />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(v) => setParam('q', v)} placeholder="Search name, email, title…" />
        <FilterSelect
          label="Site"
          value={site}
          onChange={(v) => setParam('site', v)}
          options={(sites.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      {users.loading && (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={10} />
        </div>
      )}
      {users.error && (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState message={users.error} onRetry={users.reload} />
        </div>
      )}
      {users.data && !users.loading && !users.error && (
        <DataTable
          ariaLabel="Users"
          rows={filtered}
          columns={columns}
          rowKey={(u) => u.id}
          emptyState={
            <EmptyState
              title="No users match these filters"
              action={
                <Button size="sm" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}
