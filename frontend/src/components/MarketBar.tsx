import type { NewsItem, QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
  items: NewsItem[];
};

function topMovers(watchlist: QuoteSnapshot[]) {
  return [...watchlist]
    .filter((item) => typeof item.change_percent === "number")
    .sort((a, b) => Math.abs(b.change_percent ?? 0) - Math.abs(a.change_percent ?? 0))
    .slice(0, 3);
}

export function MarketBar({ watchlist, items }: Props) {
  const movers = topMovers(watchlist);
  const headlines = items.slice(0, 3);

  return (
    <section className="market-bar">
      <div className="market-bar-block">
        <span className="market-bar-label">Pulse</span>
        <div className="market-bar-ticker-list">
          {movers.map((item) => (
            <div key={item.ticker} className="market-chip">
              <strong>{item.ticker}</strong>
              <span className={typeof item.change_percent === "number" && item.change_percent >= 0 ? "positive" : "negative"}>
                {typeof item.change_percent === "number" ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="market-bar-block market-bar-news">
        <span className="market-bar-label">Brief</span>
        <div className="market-bar-headlines">
          {headlines.map((item, index) => (
            <a key={`${item.title}-${index}`} href={item.link ?? "#"} target="_blank" rel="noreferrer">
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
