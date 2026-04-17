import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
  onSelectTicker: (ticker: string) => void;
  onSelectSector: (sector: string) => void;
};

type SectorBucket = {
  name: string;
  avgChange: number;
  leader: QuoteSnapshot | null;
  laggard: QuoteSnapshot | null;
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
      const sorted = [...names].sort((a, b) => (b.change_percent ?? -999) - (a.change_percent ?? -999));
      return {
        name,
        avgChange,
        leader: sorted[0] ?? null,
        laggard: sorted[sorted.length - 1] ?? null,
      };
    })
    .sort((a, b) => b.avgChange - a.avgChange);
}

function moveLabel(item: QuoteSnapshot | null): string {
  if (!item || typeof item.change_percent !== "number") return "—";
  return `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%`;
}

export function SectorHeatmap({ watchlist, onSelectTicker, onSelectSector }: Props) {
  const sectors = buildBuckets(watchlist);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sector heatmap</h2>
        <p>Each tile shows sector tone plus the internal leader and laggard, so relative movement is easier to read.</p>
      </div>

      <div className="sector-heatmap">
        {sectors.map((sector) => (
          <div
            key={sector.name}
            className={sector.avgChange >= 0 ? "sector-heat-card sector-positive" : "sector-heat-card sector-negative"}
            onClick={() => onSelectSector(sector.name)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectSector(sector.name);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="sector-heat-top">
              <strong>{sector.name}</strong>
              <span>
                {sector.avgChange >= 0 ? "+" : ""}
                {sector.avgChange.toFixed(2)}%
              </span>
            </div>

            <div className="sector-heat-duo">
              <button
                type="button"
                className="heat-ticker heat-ticker-leader"
                onClick={(event) => {
                  event.stopPropagation();
                  sector.leader && onSelectTicker(sector.leader.ticker);
                }}
                disabled={!sector.leader}
              >
                <span>Leader</span>
                <strong>{sector.leader?.ticker ?? "—"}</strong>
                <em>{moveLabel(sector.leader)}</em>
              </button>

              <button
                type="button"
                className="heat-ticker heat-ticker-laggard"
                onClick={(event) => {
                  event.stopPropagation();
                  sector.laggard && onSelectTicker(sector.laggard.ticker);
                }}
                disabled={!sector.laggard}
              >
                <span>Laggard</span>
                <strong>{sector.laggard?.ticker ?? "—"}</strong>
                <em>{moveLabel(sector.laggard)}</em>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
