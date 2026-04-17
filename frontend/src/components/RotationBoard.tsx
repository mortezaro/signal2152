import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

type SectorRow = {
  sector: string;
  avgChange: number;
};

function buildRows(watchlist: QuoteSnapshot[]): SectorRow[] {
  const map = new Map<string, number[]>();

  for (const item of watchlist) {
    const sector = item.sector ?? "Other";
    const current = map.get(sector) ?? [];
    if (typeof item.change_percent === "number") current.push(item.change_percent);
    map.set(sector, current);
  }

  return [...map.entries()]
    .map(([sector, values]) => ({
      sector,
      avgChange: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    }))
    .sort((a, b) => b.avgChange - a.avgChange);
}

export function RotationBoard({ watchlist }: Props) {
  const rows = buildRows(watchlist);
  const leaders = rows.slice(0, 3);
  const laggards = [...rows].reverse().slice(0, 3);

  return (
    <section className="panel panel-compact">
      <div className="panel-header">
        <h2>Rotation board</h2>
        <p>Quick sector ranking so the right rail carries actual market context instead of open space.</p>
      </div>

      <div className="rotation-grid">
        <div className="rotation-column">
          <span className="eyebrow">Leading sectors</span>
          {leaders.map((row) => (
            <div key={`leader-${row.sector}`} className="rotation-row">
              <strong>{row.sector}</strong>
              <span className="positive">+{row.avgChange.toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div className="rotation-column">
          <span className="eyebrow">Lagging sectors</span>
          {laggards.map((row) => (
            <div key={`lag-${row.sector}`} className="rotation-row">
              <strong>{row.sector}</strong>
              <span className={row.avgChange >= 0 ? "positive" : "negative"}>
                {row.avgChange >= 0 ? "+" : ""}
                {row.avgChange.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
