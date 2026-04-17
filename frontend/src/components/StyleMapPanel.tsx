import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
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

export function StyleMapPanel({ watchlist }: Props) {
  const snapshotByTicker = new Map(watchlist.map((item) => [item.ticker, item]));
  const rows = STYLE_BUCKETS.map((bucket) => {
    const names = bucket.tickers.map((ticker) => snapshotByTicker.get(ticker)).filter(Boolean) as QuoteSnapshot[];
    const avgMove = average(names.map((item) => item.change_percent ?? 0));
    const breadth = names.length ? names.filter((item) => (item.change_percent ?? 0) > 0).length / names.length : 0;
    return { ...bucket, avgMove, breadth };
  });

  return (
    <section className="panel panel-compact">
      <div className="panel-header panel-header-tight">
        <h2>Style map</h2>
        <p>Fast read on the tape by cluster, closer to a desk cheat sheet than a factor report.</p>
      </div>

      <div className="style-map-grid">
        {rows.map((row) => (
          <div key={row.label} className="style-card">
            <div className="style-card-top">
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
    </section>
  );
}
