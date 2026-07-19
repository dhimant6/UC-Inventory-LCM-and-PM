/**
 * Generic data-dense table: sortable columns, column visibility controls,
 * bulk row selection, pagination, sticky header. Below the md breakpoint it
 * degrades to a card list. Filtering/search live in the page toolbar; the
 * table renders whatever rows it is given.
 */
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Enables sorting when provided. */
  sortValue?: (row: T) => string | number;
  /** Hidden by default; user can enable it from column controls. */
  defaultHidden?: boolean;
  /** Shown as the card title on narrow screens. */
  primary?: boolean;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyState: ReactNode;
  /** Rendered when at least one row is selected; receives selected keys. */
  bulkActions?: (selectedKeys: string[], clear: () => void) => ReactNode;
  ariaLabel: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  pageSize = 25,
  emptyState,
  bulkActions,
  ariaLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  // Reset paging/selection when the row set changes (e.g. filters applied).
  const rowSignature = rows.length;
  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [rowSignature]);

  useEffect(() => {
    if (!columnsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [columnsOpen]);

  const visibleColumns = columns.filter((c) => !hidden.has(c.key));

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const value = column.sortValue;
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * pageSize, (clampedPage + 1) * pageSize);
  const pageKeys = pageRows.map(rowKey);
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  if (rows.length === 0) {
    return <div className="rounded-lg border border-line bg-surface">{emptyState}</div>;
  }

  const primaryColumn = columns.find((c) => c.primary) ?? columns[0];

  return (
    <div className="rounded-lg border border-line bg-surface shadow-1">
      {/* Toolbar row: bulk actions + column controls */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-h-7 text-sm text-ink-2">
          {selected.size > 0 && bulkActions ? (
            <div className="flex items-center gap-2">
              <span className="tabular font-medium text-ink-1">{selected.size} selected</span>
              {bulkActions([...selected], () => setSelected(new Set()))}
            </div>
          ) : (
            <span className="tabular">{rows.length.toLocaleString()} rows</span>
          )}
        </div>
        <div className="relative" ref={columnsRef}>
          <Button
            variant="ghost"
            size="sm"
            aria-haspopup="true"
            aria-expanded={columnsOpen}
            onClick={() => setColumnsOpen((o) => !o)}
          >
            <Columns3 aria-hidden className="h-3.5 w-3.5" /> Columns
          </Button>
          {columnsOpen && (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-line bg-surface p-2 shadow-3">
              {columns.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink-1 hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={!hidden.has(c.key)}
                    onChange={() =>
                      setHidden((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.key)) next.delete(c.key);
                        else next.add(c.key);
                        return next;
                      })
                    }
                  />
                  {c.header}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table (md+) */}
      <div className="hidden max-h-[65vh] overflow-auto md:block">
        <table className="w-full border-collapse text-sm" aria-label={ariaLabel}>
          <thead className="sticky top-0 z-10 bg-surface shadow-[inset_0_-1px_0_var(--line)]">
            <tr>
              {bulkActions && (
                <th scope="col" className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    className="accent-[var(--accent)]"
                    checked={allPageSelected}
                    onChange={togglePage}
                  />
                </th>
              )}
              {visibleColumns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                  className={clsx(
                    'whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-3',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {c.sortValue ? (
                    <button
                      className="micro inline-flex items-center gap-1 rounded-sm hover:text-ink-1"
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.header}
                      {sortKey === c.key &&
                        (sortDir === 'asc' ? (
                          <ArrowUp aria-hidden className="h-3 w-3" />
                        ) : (
                          <ArrowDown aria-hidden className="h-3 w-3" />
                        ))}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  className={clsx(
                    'micro border-t border-line',
                    onRowClick && 'cursor-pointer hover:bg-surface-2',
                    selected.has(key) && 'bg-accent-soft/40',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter') onRowClick(row);
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {bulkActions && (
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${key}`}
                        className="accent-[var(--accent)]"
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                      />
                    </td>
                  )}
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        'px-3 py-2 text-ink-1',
                        c.align === 'right' && 'text-right tabular',
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Card list (below md) */}
      <ul className="divide-y divide-line md:hidden" aria-label={ariaLabel}>
        {pageRows.map((row) => {
          const key = rowKey(row);
          return (
            <li key={key}>
              <button
                className="micro block w-full px-4 py-3 text-left hover:bg-surface-2"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                <div className="text-sm font-medium text-ink-1">{primaryColumn.render(row)}</div>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                  {visibleColumns
                    .filter((c) => c.key !== primaryColumn.key)
                    .slice(0, 6)
                    .map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-[11px] uppercase tracking-wide text-ink-3">
                          {c.header}
                        </dt>
                        <dd className="truncate text-sm text-ink-1">{c.render(row)}</dd>
                      </div>
                    ))}
                </dl>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-line px-3 py-2">
        <span className="tabular text-xs text-ink-2">
          Page {clampedPage + 1} of {pageCount}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Previous page"
            disabled={clampedPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Next page"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
