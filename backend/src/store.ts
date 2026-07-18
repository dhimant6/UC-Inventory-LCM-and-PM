import { generateSeedData, SeedData } from './seed/generate';

/**
 * In-memory application store, rebuilt deterministically from the seed on
 * every boot. Mutations (marking notifications read, etc.) live for the
 * process lifetime only — this console is a management view over vendor
 * systems of record, not a database of record itself.
 */
let store: SeedData | null = null;

export function getStore(): SeedData {
  if (!store) store = generateSeedData();
  return store;
}

/** Test hook: rebuild the store from a known seed/anchor. */
export function resetStore(seed?: number, anchorMs?: number): SeedData {
  store = generateSeedData(seed, anchorMs);
  return store;
}
