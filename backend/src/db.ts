import { Pool } from 'pg';
import type { PhoneNumber, Project } from './domain/types';
import { env } from './env';
import { getStore } from './store';

/**
 * Optional Postgres persistence for the user-authored entities (projects and
 * phone numbers). When DATABASE_URL is unset the whole layer no-ops and the
 * app runs in-memory exactly as before, so local dev, tests and the
 * zero-config demo are unaffected.
 *
 * Strategy: write-through. The in-memory store stays the working set the
 * routes read from; on boot we load persisted rows into it, and every
 * mutation is mirrored to Postgres. Records are stored as jsonb so the schema
 * follows the domain model without column-by-column mapping.
 */

let pool: Pool | null = null;

export function isPersistent(): boolean {
  return pool !== null;
}

export async function initDb(): Promise<void> {
  if (!env.databaseUrl) {
    console.log('[db] DATABASE_URL not set — running in-memory (no persistence)');
    return;
  }
  // Managed Postgres (Render, Heroku, …) needs TLS; a local server does not.
  const isLocal = /localhost|127\.0\.0\.1/.test(env.databaseUrl) || /sslmode=disable/.test(env.databaseUrl);
  pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS phone_numbers (
      e164 text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const store = getStore();
  const { rows: projectCount } = await pool.query<{ count: string }>(
    'SELECT count(*) FROM projects',
  );

  if (Number(projectCount[0].count) === 0) {
    // First boot against an empty database: seed it from the generator so the
    // deployed app starts populated, then it becomes the source of truth.
    console.log('[db] empty database — seeding projects & phone numbers');
    await seedFrom(store.projects, store.numbers);
  } else {
    console.log('[db] loading persisted projects & phone numbers');
    const [projects, numbers] = await Promise.all([
      pool.query<{ data: Project }>('SELECT data FROM projects'),
      pool.query<{ data: PhoneNumber }>('SELECT data FROM phone_numbers'),
    ]);
    store.projects = projects.rows.map((r) => r.data);
    store.numbers = numbers.rows.map((r) => r.data);
    ensureImportedRange();
  }
}

async function seedFrom(projects: Project[], numbers: PhoneNumber[]): Promise<void> {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of projects) {
      await client.query('INSERT INTO projects (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [p.id, p]);
    }
    for (const n of numbers) {
      await client.query('INSERT INTO phone_numbers (e164, data) VALUES ($1, $2) ON CONFLICT (e164) DO NOTHING', [n.e164, n]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** The Numbers page derives ranges from seed; keep the imported bucket present. */
function ensureImportedRange(): void {
  const store = getStore();
  if (
    store.numbers.some((n) => n.rangeId === 'range-imported') &&
    !store.numberRanges.some((r) => r.id === 'range-imported')
  ) {
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
}

/* ---------------- write-through helpers (no-op without a pool) ---------------- */

export async function persistProject(project: Project): Promise<void> {
  if (!pool) return;
  await pool
    .query(
      `INSERT INTO projects (id, data, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()`,
      [project.id, project],
    )
    .catch((e) => console.error('[db] persistProject failed:', e));
}

export async function deletePersistedProject(id: string): Promise<void> {
  if (!pool) return;
  await pool
    .query('DELETE FROM projects WHERE id = $1', [id])
    .catch((e) => console.error('[db] deletePersistedProject failed:', e));
}

export async function persistNumbers(numbers: PhoneNumber[]): Promise<void> {
  if (!pool || numbers.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const n of numbers) {
      await client.query(
        `INSERT INTO phone_numbers (e164, data, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (e164) DO UPDATE SET data = excluded.data, updated_at = now()`,
        [n.e164, n],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[db] persistNumbers failed:', error);
  } finally {
    client.release();
  }
}
