import { useEffect, useMemo, useState } from "react";

import { getTickerFinancials, getTickerHistory, getTickerNews, getTickerOverview } from "../lib/api";
import type {
  FinancialRow,
  NewsItem,
  PriceBar,
  TickerFinancialsPayload,
  TickerHistoryPayload,
  TickerOverviewPayload,
} from "../lib/types";

type Props = {
  ticker: string | null;
  onClose: () => void;
};

type DrawerTab = "overview" | "prediction" | "fundamentals";
type DrawerTimeframe = "1M" | "3M" | "6M";

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number") return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(1);
}

function InteractiveChart({ bars }: { bars: PriceBar[] }) {
  const closes = bars
    .map((bar) => ({ date: bar.date, close: bar.close }))
    .filter((bar): bar is { date: string; close: number } => typeof bar.close === "number");
  const [activeIndex, setActiveIndex] = useState<number | null>(closes.length ? closes.length - 1 : null);

  useEffect(() => {
    setActiveIndex(closes.length ? closes.length - 1 : null);
  }, [bars.length]);

  if (!closes.length) return <div className="drawer-chart-empty" />;

  const min = Math.min(...closes.map((bar) => bar.close));
  const max = Math.max(...closes.map((bar) => bar.close));
  const span = max - min || 1;
  const points = closes
    .map((bar, index) => {
      const x = (index / Math.max(closes.length - 1, 1)) * 100;
      const y = 100 - ((bar.close - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const active = activeIndex != null ? closes[activeIndex] : null;

  return (
    <div className="interactive-chart-wrap">
      <div className="interactive-chart-meta">
        <strong>{active ? active.close.toFixed(2) : "—"}</strong>
        <span>{active?.date ?? ""}</span>
      </div>
      <div className="interactive-chart-hitbox">
        <svg className="drawer-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} />
        </svg>
        <div className="interactive-chart-sensors">
          {closes.map((bar, index) => (
            <button
              key={`${bar.date}-${index}`}
              type="button"
              aria-label={bar.date}
              className="interactive-chart-sensor"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PredictionHistory({ overview }: { overview?: TickerOverviewPayload | null }) {
  const history = overview?.prediction?.history ?? [];
  const values = history
    .map((row) => row.prediction)
    .filter((value): value is number => typeof value === "number")
    .slice(-24);

  if (!values.length) return <p className="empty-copy">No prediction history available.</p>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return (
    <div className="prediction-history">
      {values.map((value, index) => {
        const height = 28 + ((value - min) / span) * 72;
        return <span key={`${value}-${index}`} style={{ height: `${height}px` }} />;
      })}
    </div>
  );
}

function FundamentalsBlock({ financials }: { financials?: TickerFinancialsPayload | null }) {
  const sections = Object.entries(financials?.financials ?? {}).filter(([, rows]) => rows.length);
  if (!sections.length) return <p className="empty-copy">No fundamentals returned for this ticker.</p>;

  return (
    <div className="fundamentals-sections">
      {sections.slice(0, 2).map(([section, rows]) => (
        <div key={section} className="fundamentals-card">
          <h4>{section.split("_").join(" ")}</h4>
          <div className="fundamentals-list">
            {(rows as FinancialRow[]).slice(0, 4).map((row) => {
              const latest = Object.values(row.values)[0];
              return (
                <div key={row.label} className="fundamentals-row">
                  <span>{row.label}</span>
                  <strong>{formatMetricValue(latest)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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
  const [financials, setFinancials] = useState<TickerFinancialsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [timeframe, setTimeframe] = useState<DrawerTimeframe>("3M");

  useEffect(() => {
    if (!ticker) return;
    setActiveTab("overview");
    Promise.all([getTickerOverview(ticker), getTickerNews(ticker, 5), getTickerFinancials(ticker)]).then(
      ([overviewData, newsData, financialsData]) => {
        setOverview(overviewData);
        setNews(newsData.items);
        setFinancials(financialsData);
      },
    );
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    const period = timeframe === "1M" ? "1mo" : timeframe === "3M" ? "3mo" : "6mo";
    getTickerHistory(ticker, period, "1d").then(setHistory);
  }, [ticker, timeframe]);

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

        <div className="tab-strip">
          <button
            type="button"
            className={activeTab === "overview" ? "tab-pill active" : "tab-pill"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={activeTab === "prediction" ? "tab-pill active" : "tab-pill"}
            onClick={() => setActiveTab("prediction")}
          >
            Prediction path
          </button>
          <button
            type="button"
            className={activeTab === "fundamentals" ? "tab-pill active" : "tab-pill"}
            onClick={() => setActiveTab("fundamentals")}
          >
            Fundamentals
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            <div className="tab-strip tab-strip-tight">
              {(["1M", "3M", "6M"] as DrawerTimeframe[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={tab === timeframe ? "tab-pill active" : "tab-pill"}
                  onClick={() => setTimeframe(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="drawer-chart-wrap">
              <InteractiveChart bars={history?.bars ?? []} />
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
          </>
        ) : null}

        {activeTab === "prediction" ? (
          <section className="drawer-section">
            <h3>Prediction history</h3>
            <PredictionHistory overview={overview} />
            <p className="drawer-summary">
              Recent model path for this ticker from the active signal source. This is useful for seeing whether conviction is strengthening or fading.
            </p>
          </section>
        ) : null}

        {activeTab === "fundamentals" ? (
          <section className="drawer-section">
            <h3>Fundamentals snapshot</h3>
            <FundamentalsBlock financials={financials} />
          </section>
        ) : null}
      </aside>
    </div>
  );
}
