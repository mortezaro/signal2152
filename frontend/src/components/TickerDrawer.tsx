import { useEffect, useMemo, useState } from "react";

import { getTickerHistory, getTickerNews, getTickerOverview } from "../lib/api";
import type { NewsItem, PriceBar, TickerHistoryPayload, TickerOverviewPayload } from "../lib/types";

type Props = {
  ticker: string | null;
  onClose: () => void;
};

function Sparkline({ bars }: { bars: PriceBar[] }) {
  const closes = bars.map((bar) => bar.close).filter((value): value is number => typeof value === "number");
  if (!closes.length) return <div className="drawer-chart-empty" />;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const points = closes
    .map((value, index) => {
      const x = (index / Math.max(closes.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="drawer-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function latestPredictionValue(overview?: TickerOverviewPayload | null): string {
  const latest = overview?.prediction?.latest;
  if (!latest) return "—";
  const value = latest.prediction;
  return typeof value === "number" ? value.toFixed(3) : "—";
}

export function TickerDrawer({ ticker, onClose }: Props) {
  const [overview, setOverview] = useState<TickerOverviewPayload | null>(null);
  const [history, setHistory] = useState<TickerHistoryPayload | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!ticker) return;
    Promise.all([getTickerOverview(ticker), getTickerHistory(ticker, "1mo", "1d"), getTickerNews(ticker, 5)]).then(
      ([overviewData, historyData, newsData]) => {
        setOverview(overviewData);
        setHistory(historyData);
        setNews(newsData.items);
      },
    );
  }, [ticker]);

  const headerName = overview?.quote?.name ?? ticker;
  const summary = useMemo(() => overview?.profile?.summary?.slice(0, 260), [overview]);

  if (!ticker) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="ticker-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{overview?.quote?.sector ?? "Ticker detail"}</p>
            <h2>{ticker}</h2>
            <p className="drawer-subtitle">{headerName}</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="drawer-stat-row">
          <div className="drawer-stat">
            <span>Price</span>
            <strong>{typeof overview?.quote?.price === "number" ? overview.quote.price.toFixed(2) : "—"}</strong>
          </div>
          <div className="drawer-stat">
            <span>Day move</span>
            <strong>
              {typeof overview?.quote?.change_percent === "number"
                ? `${overview.quote.change_percent >= 0 ? "+" : ""}${overview.quote.change_percent.toFixed(2)}%`
                : "—"}
            </strong>
          </div>
          <div className="drawer-stat">
            <span>Signal</span>
            <strong>{latestPredictionValue(overview)}</strong>
          </div>
        </div>

        <div className="drawer-chart-wrap">
          <Sparkline bars={history?.bars ?? []} />
        </div>

        {summary ? <p className="drawer-summary">{summary}…</p> : null}

        <div className="drawer-news">
          <h3>Latest on {ticker}</h3>
          <div className="drawer-news-list">
            {news.map((item, index) => (
              <a key={`${item.title}-${index}`} href={item.link ?? "#"} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
