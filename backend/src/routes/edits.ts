import { Request, Router } from 'express';
import type { PhoneNumber, Project, ProjectStatus } from '../domain/types';
import { getStore } from '../store';

/** Create / update / delete / import for projects and phone numbers. */
export const editsRouter = Router();

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'in-flight', 'blocked', 'complete'];

function nextId(prefix: string, existing: { id: string }[]): string {
  let max = 0;
  for (const item of existing) {
    const n = Number(item.id.replace(`${prefix}-`, ''));
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}-${max + 1}`;
}

function logActivity(
  message: string,
  entityType: 'project' | 'number',
  entityId: string,
  actor = 'admin',
): void {
  try {
    getStore().activity.unshift({
      id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      type: entityType === 'project' ? 'project.status' : 'number.assigned',
      actor,
      message,
      entityType,
      entityId,
    });
  } catch {
    // best-effort
  }
}

/** Coerce an arbitrary object into a valid Project, filling sane defaults. */
function normalizeProject(input: Record<string, unknown>, id: string): Project | null {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) return null;
  const status = PROJECT_STATUSES.includes(input.status as ProjectStatus)
    ? (input.status as ProjectStatus)
    : 'planning';
  const progress = Math.max(0, Math.min(100, Number(input.progress) || 0));
  const today = new Date().toISOString().slice(0, 10);
  const asString = (v: unknown, fallback = ''): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  return {
    id,
    name,
    client: asString(input.client, '—'),
    status,
    startDate: asString(input.startDate, today),
    targetDate: asString(input.targetDate, today),
    owner: asString(input.owner, 'Unassigned'),
    description: asString(input.description),
    siteIds: Array.isArray(input.siteIds) ? (input.siteIds as string[]) : [],
    progress,
  };
}

/* ---------------- Projects ---------------- */

editsRouter.post('/projects', (req, res) => {
  const store = getStore();
  const project = normalizeProject(req.body ?? {}, nextId('proj', store.projects));
  if (!project) {
    res.status(400).json({ error: 'A project name is required' });
    return;
  }
  store.projects.push(project);
  logActivity(`Project "${project.name}" created`, 'project', project.id);
  res.status(201).json(project);
});

editsRouter.put('/projects/:id', (req, res) => {
  const store = getStore();
  const index = store.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  const merged = normalizeProject(
    { ...store.projects[index], ...(req.body ?? {}) },
    req.params.id,
  );
  if (!merged) {
    res.status(400).json({ error: 'A project name is required' });
    return;
  }
  store.projects[index] = merged;
  logActivity(`Project "${merged.name}" updated`, 'project', merged.id);
  res.json(merged);
});

editsRouter.delete('/projects/:id', (req, res) => {
  const store = getStore();
  const project = store.projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  store.projects = store.projects.filter((p) => p.id !== req.params.id);
  // Detach devices/numbers from the removed project.
  for (const d of store.devices) if (d.projectId === req.params.id) d.projectId = undefined;
  for (const n of store.numbers) if (n.projectId === req.params.id) n.projectId = undefined;
  logActivity(`Project "${project.name}" deleted`, 'project', project.id);
  res.json({ ok: true });
});

// Bulk import: accepts an array of project rows; upserts by id when present.
editsRouter.post('/projects/import', (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body?.rows;
  if (!Array.isArray(rows)) {
    res.status(400).json({ error: 'Expected an array of project rows' });
    return;
  }
  const store = getStore();
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  for (const [i, raw] of rows.entries()) {
    const existingId = typeof raw?.id === 'string' && raw.id ? raw.id : null;
    const index = existingId ? store.projects.findIndex((p) => p.id === existingId) : -1;
    const id = index >= 0 ? existingId! : nextId('proj', store.projects);
    const project = normalizeProject(raw ?? {}, id);
    if (!project) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }
    if (index >= 0) {
      store.projects[index] = project;
      updated += 1;
    } else {
      store.projects.push(project);
      created += 1;
    }
  }
  logActivity(`Imported projects (${created} new, ${updated} updated)`, 'project', 'import');
  res.json({ created, updated, errors });
});

/* ---------------- Phone numbers import ---------------- */

const NUMBER_STATUSES = ['assigned', 'unassigned', 'reserved', 'porting'] as const;

function normalizeNumber(input: Record<string, unknown>): PhoneNumber | null {
  const rawE164 = typeof input.e164 === 'string' ? input.e164 : '';
  const e164 = rawE164.replace(/[^\d+]/g, '');
  if (!/^\+\d{6,15}$/.test(e164)) return null;
  const status = (NUMBER_STATUSES as readonly string[]).includes(input.status as string)
    ? (input.status as PhoneNumber['status'])
    : input.assignedUserId || input.assignedDeviceId
      ? 'assigned'
      : 'unassigned';
  const asString = (v: unknown, fallback = ''): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  return {
    id: `num-imp-${e164.replace('+', '')}`,
    e164,
    country: asString(input.country, guessCountry(e164)),
    status,
    carrier: asString(input.carrier, 'Imported'),
    rangeId: asString(input.rangeId, 'range-imported'),
    assignedUserId: asString(input.assignedUserId) || undefined,
    assignedDeviceId: asString(input.assignedDeviceId) || undefined,
    projectId: asString(input.projectId) || undefined,
  };
}

function guessCountry(e164: string): string {
  if (e164.startsWith('+1')) return 'US';
  if (e164.startsWith('+44')) return 'GB';
  if (e164.startsWith('+49')) return 'DE';
  if (e164.startsWith('+65')) return 'SG';
  if (e164.startsWith('+61')) return 'AU';
  return '';
}

// Import numbers (e.g. a Teams Admin Center number export mapped client-side).
editsRouter.post('/numbers/import', (req: Request, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body?.rows;
  if (!Array.isArray(rows)) {
    res.status(400).json({ error: 'Expected an array of number rows' });
    return;
  }
  const store = getStore();
  const bySig = new Map(store.numbers.map((n) => [n.e164, n]));
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const ensureRange = () => {
    if (!store.numberRanges.some((r) => r.id === 'range-imported')) {
      store.numberRanges.push({
        id: 'range-imported',
        label: 'Imported numbers',
        carrier: 'Imported',
        country: '',
        first: '',
        last: '',
        size: 0,
      });
    }
  };
  for (const [i, raw] of rows.entries()) {
    const number = normalizeNumber(raw ?? {});
    if (!number) {
      errors.push(`Row ${i + 1}: invalid E.164 number`);
      continue;
    }
    const existing = bySig.get(number.e164);
    if (existing) {
      Object.assign(existing, number, { id: existing.id, rangeId: existing.rangeId });
      updated += 1;
    } else {
      if (number.rangeId === 'range-imported') ensureRange();
      store.numbers.push(number);
      bySig.set(number.e164, number);
      created += 1;
    }
  }
  logActivity(`Imported phone numbers (${created} new, ${updated} updated)`, 'number', 'import');
  res.json({ created, updated, errors });
});
