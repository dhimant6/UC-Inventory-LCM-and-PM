import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drawer, DrawerField } from '../components/drawer';
import { ImportModal } from '../components/importModal';
import { ProjectFormModal } from '../components/projectForm';
import { PageHeader } from '../components/shell';
import { Column, DataTable } from '../components/table';
import { ActiveFilterChips, FilterSelect, SearchInput } from '../components/toolbar';
import {
  Button,
  EmptyState,
  ErrorState,
  Modal,
  ProgressBar,
  StatusBadge,
  TableSkeleton,
} from '../components/ui';
import { api, ProjectInput } from '../lib/api';
import { daysUntil, formatDate, formatE164 } from '../lib/format';
import type { Project, ProjectDetail } from '../lib/types';
import { useFetch } from '../lib/useFetch';

function ProjectDrawer({
  projectId,
  onClose,
  onEdit,
  onDelete,
}: {
  projectId: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data, loading, error, reload } = useFetch<ProjectDetail | null>(
    () => (projectId ? api.project(projectId) : Promise.resolve(null)),
    [projectId],
  );

  return (
    <Drawer open={projectId !== null} onClose={onClose} title={data?.name ?? 'Project'}>
      {loading && <TableSkeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && !loading && !error && (
        <>
        <div className="mb-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil aria-hidden className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 aria-hidden className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
        <dl className="divide-y divide-line">
          <DrawerField label="Status">
            <StatusBadge status={data.status} />
            {data.status !== 'complete' && daysUntil(data.targetDate) < 0 && (
              <span className="ml-2 text-sm font-medium text-crit-ink">
                {Math.abs(daysUntil(data.targetDate))} days overdue
              </span>
            )}
          </DrawerField>
          <DrawerField label="Client">{data.client}</DrawerField>
          <DrawerField label="Owner">{data.owner}</DrawerField>
          <DrawerField label="Timeline">
            {formatDate(data.startDate)} → {formatDate(data.targetDate)}
          </DrawerField>
          <DrawerField label={`Progress · ${data.progress}%`}>
            <ProgressBar value={data.progress} label="Project progress" />
          </DrawerField>
          <DrawerField label="Sites">
            {data.sites.map((s) => `${s.name} (${s.city})`).join(', ') || '—'}
          </DrawerField>
          <DrawerField label="Description">{data.description}</DrawerField>
          <DrawerField label={`Devices · ${data.devices.length}`}>
            {data.devices.length === 0 && <span className="text-ink-3">None yet</span>}
            <ul className="space-y-1">
              {data.devices.slice(0, 8).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{d.name}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
              {data.devices.length > 8 && (
                <li className="text-xs text-ink-3">+{data.devices.length - 8} more</li>
              )}
            </ul>
          </DrawerField>
          <DrawerField label={`Numbers · ${data.numbers.length}`}>
            {data.numbers.length === 0 && <span className="text-ink-3">None yet</span>}
            <ul className="space-y-1">
              {data.numbers.slice(0, 6).map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="tabular">{formatE164(n.e164)}</span>
                  <StatusBadge status={n.status} />
                </li>
              ))}
              {data.numbers.length > 6 && (
                <li className="text-xs text-ink-3">+{data.numbers.length - 6} more</li>
              )}
            </ul>
          </DrawerField>
        </dl>
        </>
      )}
    </Drawer>
  );
}

export default function ProjectsPage() {
  const projects = useFetch(() => api.projects(), []);
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedProject = projects.data?.find((p) => p.id === selected) ?? null;

  const saveProject = async (input: ProjectInput) => {
    if (editing) await api.updateProject(editing.id, input);
    else await api.createProject(input);
    projects.reload();
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    setBusy(true);
    try {
      await api.deleteProject(selectedProject.id);
      setDeleteOpen(false);
      setSelected(null);
      projects.reload();
    } finally {
      setBusy(false);
    }
  };

  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';

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
    const list = projects.data ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        (!needle ||
          [p.name, p.client, p.owner].some((f) => f.toLowerCase().includes(needle))) &&
        (!status || p.status === status),
    );
  }, [projects.data, q, status]);

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      primary: true,
      sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-ink-3">{p.client}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => p.status,
      render: (p) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={p.status} />
          {p.status !== 'complete' && daysUntil(p.targetDate) < 0 && (
            <span className="rounded-full bg-crit px-1.5 py-0.5 text-[11px] font-semibold text-on-accent">
              Overdue
            </span>
          )}
        </div>
      ),
    },
    { key: 'owner', header: 'Owner', sortValue: (p) => p.owner, render: (p) => <span className="text-ink-2">{p.owner}</span> },
    {
      key: 'target',
      header: 'Target date',
      sortValue: (p) => p.targetDate,
      render: (p) => formatDate(p.targetDate),
    },
    {
      key: 'progress',
      header: 'Progress',
      sortValue: (p) => p.progress,
      render: (p) => (
        <div className="flex w-36 items-center gap-2">
          <ProgressBar value={p.progress} label={`${p.name} progress`} />
          <span className="tabular w-9 text-right text-xs text-ink-2">{p.progress}%</span>
        </div>
      ),
    },
    { key: 'devices', header: 'Devices', align: 'right', sortValue: (p) => p.deviceCount, render: (p) => p.deviceCount },
    { key: 'numbers', header: 'Numbers', align: 'right', sortValue: (p) => p.numberCount, render: (p) => p.numberCount },
    {
      key: 'start',
      header: 'Start date',
      defaultHidden: true,
      sortValue: (p) => p.startDate,
      render: (p) => formatDate(p.startDate),
    },
  ];

  const chips = [
    status && { key: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') },
  ].filter((c): c is { key: string; label: string; onRemove: () => void } => Boolean(c));

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Deployment programmes and their rollout state across clients and sites."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload aria-hidden className="h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden className="h-3.5 w-3.5" /> New project
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(v) => setParam('q', v)} placeholder="Search project, client, owner…" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setParam('status', v)}
          options={[
            { value: 'planning', label: 'Planning' },
            { value: 'in-flight', label: 'In flight' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'complete', label: 'Complete' },
          ]}
        />
      </div>
      <div className="mb-3">
        <ActiveFilterChips chips={chips} onClear={() => setParams({}, { replace: true })} />
      </div>

      {projects.loading && (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={8} />
        </div>
      )}
      {projects.error && (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState message={projects.error} onRetry={projects.reload} />
        </div>
      )}
      {projects.data && !projects.loading && !projects.error && (
        <DataTable
          ariaLabel="Projects"
          rows={filtered}
          columns={columns}
          rowKey={(p) => p.id}
          onRowClick={(p) => setSelected(p.id)}
          emptyState={
            <EmptyState
              title="No projects match these filters"
              action={
                <Button size="sm" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
              }
            />
          }
        />
      )}

      <ProjectDrawer
        projectId={selected}
        onClose={() => setSelected(null)}
        onEdit={() => {
          setEditing(selectedProject);
          setFormOpen(true);
        }}
        onDelete={() => setDeleteOpen(true)}
      />

      <ProjectFormModal
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={saveProject}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import projects"
        description="Upload a CSV to create or update projects. An id column updates an existing project; leave it blank to create."
        sampleHeader="name,client,owner,status,startDate,targetDate,progress,description"
        mapRow={(r) => ({
          id: r.id || undefined,
          name: r.name,
          client: r.client,
          owner: r.owner,
          status: r.status,
          startDate: r.startDate,
          targetDate: r.targetDate,
          progress: r.progress,
          description: r.description,
        })}
        onImport={(rows) => api.importProjects(rows)}
        onDone={() => projects.reload()}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete project" width="max-w-sm">
        <p className="text-sm text-ink-2">
          Delete <b className="text-ink-1">{selectedProject?.name}</b>? Devices and numbers stay, but
          are detached from this project. This can't be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={confirmDelete}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
