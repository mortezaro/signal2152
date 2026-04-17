import { useMemo, useState } from "react";

import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

type LensTab = "Persistence" | "Style";

type SectorMomentumRow = {
  sector: string;
  day: number;
  week: number;
  month: number;
  persistence: "Extending" | "Building" | "Fading" | "Mixed";
};

type StyleBucket = {
  label: string;
  tickers: string[];
};

const STYLE_BUCKETS: StyleBucket[] = [
  { label: "Growth / AI", tickers: ["AAPL", "MSFT", "NVDA", "AVGO", "META", "GOOGL", "NFLX", "QQQ"] },
  { label: "Energy", tickers: ["XOM", "CVX", "COP"] },
  { label: "Financials", tickers: ["JPM", "GS", "SCHW"] },
  { label: "Healthcare", tickers: ["LLY", "UNH", "ISRG"] },
  { label: "Consumer", tickers: ["AMZN", "HD", "NKE", "MCD"] },
  { label: "Industrials", tickers: ["CAT", "HON", "GE"] },
];

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

function buildMomentumRows(watchlist: QuoteSnapshot[]): SectorMomentumRow[] {
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
      const persistence: SectorMomentumRow["persistence"] =
        positiveCount === 3 ? "Extending" : positiveCount === 2 ? "Building" : positiveCount === 1 ? "Fading" : "Mixed";

      return { sector, day, week, month, persistence };
    })
    .sort((a, b) => b.week - a.week)
    .slice(0, 5);
}

export function MarketLensPanel({ watchlist }: Props) {
  const [activeTab, setActiveTab] = useState<LensTab>("Persistence");

  const momentumRows = useMemo(() => buildMomentumRows(watchlist), [watchlist]);
  const styleRows = useMemo(() => {
    const snapshotByTicker = new Map(watchlist.map((item) => [item.ticker, item]));
    return STYLE_BUCKETS.map((bucket) => {
      const names = bucket.tickers.map((ticker) => snapshotByTicker.get(ticker)).filter(Boolean) as QuoteSnapshot[];
      const avgMove = average(names.map((item) => item.change_percent ?? 0));
      const breadth = names.length ? names.filter((item) => (item.change_percent ?? 0) > 0).length / names.length : 0;
      return { ...bucket, avgMove, breadth };
    }).slice(0, 5);
  }, [watchlist]);

  return (
    <section className="panel panel-compact">
      <div className="panel-header panel-header-tight">
        <h2>Market lens</h2>
        <p>Compact context for whether leadership is persisting and which style clusters are carrying the tape.</p>
      </div>

      <div className="tab-strip tab-strip-tight">
        {(["Persistence", "Style"] as LensTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "tab-pill active" : "tab-pill"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Persistence" ? (
        <div className="compact-list">
          {momentumRows.map((row) => (
            <div key={row.sector} className="compact-row">
              <div className="compact-row-main">
                <strong>{row.sector}</strong>
                <span>{row.persistence}</span>
              </div>
              <div className="compact-triplet">
                <em>{row.day >= 0 ? "+" : ""}{row.day.toFixed(1)}%</em>
                <em>{row.week >= 0 ? "+" : ""}{row.week.toFixed(1)}%</em>
                <em>{row.month >= 0 ? "+" : ""}{row.month.toFixed(1)}%</em>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="compact-list">
          {styleRows.map((row) => (
            <div key={row.label} className="compact-row compact-row-stack">
              <div className="compact-row-main compact-row-top">
                <strong>{row.label}</strong>
                <span className={row.avgMove >= 0 ? "positive" : "negative"}>
                  {row.avgMove >= 0 ? "+" : ""}
                  {row.avgMove.toFixed(2)}%
                </span>
              </div>
              <div className="style-meter">
                <span style={{ width: `${Math.max(8, row.breadth * 100)}%` }} />
              </div>
              <small>{Math.round(row.breadth * 100)}% positive breadth</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
