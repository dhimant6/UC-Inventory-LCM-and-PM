import { FormEvent, useState } from 'react';
import type { ProjectInput } from '../lib/api';
import type { Project, ProjectStatus } from '../lib/types';
import { Button, Field, Modal, Select, TextInput, Textarea } from './ui';

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-flight', label: 'In flight' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

/** Create/edit form. `project` present = edit mode, absent = create mode. */
export function ProjectFormModal({
  open,
  project,
  onClose,
  onSubmit,
}: {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectInput>(() => blank(project));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form whenever the target project (or open state) changes.
  const [seedKey, setSeedKey] = useState('');
  const key = `${open}-${project?.id ?? 'new'}`;
  if (key !== seedKey) {
    setSeedKey(key);
    setForm(blank(project));
    setError(null);
  }

  const set = (patch: Partial<ProjectInput>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError('A project name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit project' : 'New project'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name">
          <TextInput value={form.name ?? ''} onChange={(e) => set({ name: e.target.value })} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client">
            <TextInput value={form.client ?? ''} onChange={(e) => set({ client: e.target.value })} />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner ?? ''} onChange={(e) => set({ owner: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select
              value={form.status ?? 'planning'}
              onChange={(e) => set({ status: e.target.value as ProjectStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Progress (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={form.progress ?? 0}
              onChange={(e) => set({ progress: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <TextInput type="date" value={form.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="Target date">
            <TextInput type="date" value={form.targetDate ?? ''} onChange={(e) => set({ targetDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-crit-ink">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={busy}>
            {busy ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function blank(project: Project | null): ProjectInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: project?.name ?? '',
    client: project?.client ?? '',
    owner: project?.owner ?? '',
    status: project?.status ?? 'planning',
    progress: project?.progress ?? 0,
    startDate: project?.startDate ?? today,
    targetDate: project?.targetDate ?? today,
    description: project?.description ?? '',
    siteIds: project?.siteIds ?? [],
  };
}
