import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

type SectorMomentumRow = {
  sector: string;
  day: number;
  week: number;
  month: number;
  persistence: "Extending" | "Building" | "Fading" | "Mixed";
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pathReturn(values: number[]): number {
  if (values.length < 2) return 0;
  const start = values[0];
  const end = values[values.length - 1];
  if (!start) return 0;
  return ((end - start) / start) * 100;
}

function buildRows(watchlist: QuoteSnapshot[]): SectorMomentumRow[] {
  const buckets = new Map<string, QuoteSnapshot[]>();

  for (const item of watchlist) {
    const sector = item.sector ?? "Other";
    const current = buckets.get(sector) ?? [];
    current.push(item);
    buckets.set(sector, current);
  }

  return [...buckets.entries()]
    .map(([sector, names]) => {
      const day = average(names.map((item) => item.change_percent ?? 0));
      const week = average(names.map((item) => pathReturn(item.sparkline_5d ?? [])));
      const month = average(names.map((item) => pathReturn(item.sparkline_1mo ?? [])));
      const positiveCount = [day, week, month].filter((value) => value > 0).length;
      const persistence =
        positiveCount === 3 ? "Extending" : positiveCount === 2 ? "Building" : positiveCount === 1 ? "Fading" : "Mixed";

      return { sector, day, week, month, persistence };
    })
    .sort((a, b) => b.week - a.week)
    .slice(0, 6);
}

export function SectorMomentumPanel({ watchlist }: Props) {
  const rows = buildRows(watchlist);

  return (
    <section className="panel panel-compact">
      <div className="panel-header panel-header-tight">
        <h2>Sector persistence</h2>
        <p>Today versus 5D versus 1M so leadership feels persistent instead of accidental.</p>
      </div>

      <div className="momentum-list">
        {rows.map((row) => (
          <div key={row.sector} className="momentum-row">
            <div>
              <strong>{row.sector}</strong>
              <span>{row.persistence}</span>
            </div>
            <div className="momentum-triplet">
              <em>{row.day >= 0 ? "+" : ""}{row.day.toFixed(1)}%</em>
              <em>{row.week >= 0 ? "+" : ""}{row.week.toFixed(1)}%</em>
              <em>{row.month >= 0 ? "+" : ""}{row.month.toFixed(1)}%</em>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
