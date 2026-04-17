import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

type SectorBucket = {
  name: string;
  avgChange: number;
  tickers: string[];
};

function buildSectorBuckets(watchlist: QuoteSnapshot[]): SectorBucket[] {
  const buckets = new Map<string, { total: number; count: number; tickers: string[] }>();

  for (const item of watchlist) {
    const sector = item.sector ?? "Other";
    const current = buckets.get(sector) ?? { total: 0, count: 0, tickers: [] };
    current.tickers.push(item.ticker);
    if (typeof item.change_percent === "number") {
      current.total += item.change_percent;
      current.count += 1;
    }
    buckets.set(sector, current);
  }

  return [...buckets.entries()]
    .map(([name, bucket]) => ({
      name,
      avgChange: bucket.count ? bucket.total / bucket.count : 0,
      tickers: bucket.tickers.slice(0, 3),
    }))
    .sort((a, b) => b.avgChange - a.avgChange);
}

export function SectorPulse({ watchlist }: Props) {
  const sectors = buildSectorBuckets(watchlist);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sector pulse</h2>
        <p>Quick breadth from the current watchlist, grouped by sector so the board feels directional instead of flat.</p>
      </div>

      <div className="sector-pulse-list">
        {sectors.map((sector) => {
          const width = Math.min(100, Math.max(8, Math.abs(sector.avgChange) * 20));
          return (
            <div key={sector.name} className="sector-pulse-row">
              <div className="sector-pulse-copy">
                <strong>{sector.name}</strong>
                <span>{sector.tickers.join(" · ")}</span>
              </div>
              <div className="sector-pulse-score">
                <strong className={sector.avgChange >= 0 ? "positive" : "negative"}>
                  {sector.avgChange >= 0 ? "+" : ""}
                  {sector.avgChange.toFixed(2)}%
                </strong>
                <div className="sector-pulse-bar">
                  <span
                    className={sector.avgChange >= 0 ? "sector-bar-positive" : "sector-bar-negative"}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
