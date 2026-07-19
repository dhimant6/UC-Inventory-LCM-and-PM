/**
 * Chart wrappers over recharts. Colors come from design tokens only:
 * vendors keep their fixed categorical slots (teams=s1, webex=s2, poly=s3),
 * status colors are reserved for state. Single axis per chart, recessive
 * grid, hover tooltips everywhere.
 */
import { ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CallQualityPoint, TicketPoint, UptimePoint, Vendor } from '../lib/types';
import { Card } from './ui';

const VENDOR_COLOR: Record<Vendor, string> = {
  teams: 'var(--s1)',
  webex: 'var(--s2)',
  poly: 'var(--s3)',
};
const VENDOR_LABEL: Record<Vendor, string> = {
  teams: 'Teams',
  webex: 'Webex',
  poly: 'Poly',
};

const AXIS = { stroke: 'var(--line-2)', fontSize: 11, fill: 'var(--ink-3)' } as const;

function axisProps() {
  return {
    tick: { fontSize: 11, fill: 'var(--ink-3)' },
    stroke: 'var(--line-2)',
    tickLine: false,
  };
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-sm)',
    boxShadow: 'var(--shadow-2)',
    fontSize: 12,
    color: 'var(--ink-1)',
  },
  labelStyle: { color: 'var(--ink-2)', fontWeight: 600 },
  itemStyle: { color: 'var(--ink-1)' },
} as const;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-ink-1">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>}
      <div className="mt-3 h-56">{children}</div>
    </Card>
  );
}

/** Pivot per-vendor series into one row per date: { date, teams, webex, poly }. */
function pivotByVendor<T extends { date: string; vendor: Vendor }>(
  points: T[],
  value: (p: T) => number,
): Record<string, number | string>[] {
  const byDate = new Map<string, Record<string, number | string>>();
  for (const p of points) {
    const row = byDate.get(p.date) ?? { date: p.date };
    row[p.vendor] = value(p);
    byDate.set(p.date, row);
  }
  return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

const VENDORS: Vendor[] = ['teams', 'webex', 'poly'];

export function CallQualityChart({ points }: { points: CallQualityPoint[] }) {
  const data = pivotByVendor(points, (p) => p.mosAvg);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...axisProps()} tickFormatter={shortDate} minTickGap={40} />
        <YAxis {...axisProps()} domain={[3.4, 4.6]} tickCount={5} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => shortDate(String(v))} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS.fill }} iconType="plainline" />
        {VENDORS.map((v) => (
          <Line
            key={v}
            type="monotone"
            dataKey={v}
            name={VENDOR_LABEL[v]}
            stroke={VENDOR_COLOR[v]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UptimeChart({ points }: { points: UptimePoint[] }) {
  const data = pivotByVendor(points, (p) => p.uptimePct);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...axisProps()} tickFormatter={shortDate} minTickGap={40} />
        <YAxis {...axisProps()} domain={[80, 100]} tickCount={5} unit="%" />
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(v) => shortDate(String(v))}
          formatter={(value) => [`${Number(value).toFixed(1)}%`]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS.fill }} iconType="plainline" />
        {VENDORS.map((v) => (
          <Line
            key={v}
            type="monotone"
            dataKey={v}
            name={VENDOR_LABEL[v]}
            stroke={VENDOR_COLOR[v]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TicketsChart({ points }: { points: TicketPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }} barGap={2}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...axisProps()} tickFormatter={shortDate} minTickGap={40} />
        <YAxis {...axisProps()} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => shortDate(String(v))} cursor={{ fill: 'var(--surface-2)' }} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS.fill }} />
        <Bar dataKey="opened" name="Opened" fill="var(--s5)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="resolved" name="Resolved" fill="var(--s2)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="backlog"
          name="Backlog"
          stroke="var(--s6)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Horizontal status distribution bar (status colors are reserved for state). */
export function StatusDistribution({
  segments,
  total,
}: {
  segments: { label: string; count: number; colorVar: string }[];
  total: number;
}) {
  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label}: ${s.count}`).join(', ')}>
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <div
              key={s.label}
              className="h-full rounded-full"
              style={{ width: `${(s.count / Math.max(1, total)) * 100}%`, background: `var(${s.colorVar})` }}
            />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: `var(${s.colorVar})` }} />
            {s.label} <span className="tabular font-medium text-ink-1">{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
