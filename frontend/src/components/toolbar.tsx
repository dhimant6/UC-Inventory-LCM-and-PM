import { Search, X } from 'lucide-react';
import { ChangeEvent } from 'react';

/** Standard page toolbar controls: text search + dimension filters. */

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
      />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="micro h-9 w-56 max-w-full rounded-sm border border-line-2 bg-surface pl-8 pr-3 text-sm text-ink-1 placeholder:text-ink-3 focus:border-accent"
      />
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-ink-2">
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="micro h-9 rounded-sm border border-line-2 bg-surface px-2 text-sm text-ink-1 focus:border-accent"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActiveFilterChips({
  chips,
  onClear,
}: {
  chips: { key: string; label: string; onRemove: () => void }[];
  onClear: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="micro inline-flex items-center gap-1 rounded-full border border-line-2 bg-surface-2 px-2.5 py-1 text-xs text-ink-1 hover:border-accent"
        >
          {chip.label}
          <X aria-hidden className="h-3 w-3" />
        </button>
      ))}
      <button onClick={onClear} className="micro text-xs text-ink-2 underline hover:text-ink-1">
        Clear all
      </button>
    </div>
  );
}
