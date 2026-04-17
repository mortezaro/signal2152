import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
  onSelectTicker: (ticker: string) => void;
};

type SectorBucket = {
  name: string;
  avgChange: number;
  names: QuoteSnapshot[];
};

function buildBuckets(watchlist: QuoteSnapshot[]): SectorBucket[] {
  const buckets = new Map<string, QuoteSnapshot[]>();

  for (const item of watchlist) {
    const sector = item.sector ?? "Other";
    const current = buckets.get(sector) ?? [];
    current.push(item);
    buckets.set(sector, current);
  }

  return [...buckets.entries()]
    .map(([name, names]) => {
      const changes = names.map((item) => item.change_percent).filter((value): value is number => typeof value === "number");
      const avgChange = changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : 0;
      return { name, avgChange, names };
    })
    .sort((a, b) => b.avgChange - a.avgChange);
}

export function SectorHeatmap({ watchlist, onSelectTicker }: Props) {
  const sectors = buildBuckets(watchlist);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sector heatmap</h2>
        <p>Cross-sectional tone by sector, with quick access to the names driving each pocket.</p>
      </div>

      <div className="sector-heatmap">
        {sectors.map((sector) => (
          <div
            key={sector.name}
            className={sector.avgChange >= 0 ? "sector-heat-card sector-positive" : "sector-heat-card sector-negative"}
          >
            <div className="sector-heat-top">
              <strong>{sector.name}</strong>
              <span>
                {sector.avgChange >= 0 ? "+" : ""}
                {sector.avgChange.toFixed(2)}%
              </span>
            </div>
            <div className="sector-heat-tickers">
              {sector.names.map((item) => (
                <button key={item.ticker} type="button" className="heat-ticker" onClick={() => onSelectTicker(item.ticker)}>
                  <strong>{item.ticker}</strong>
                  <span>
                    {typeof item.change_percent === "number"
                      ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%`
                      : "—"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
