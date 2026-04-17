import { useMemo, useState } from "react";

import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
  onSelectTicker: (ticker: string) => void;
};

function formatPrice(value?: number | null): string {
  return typeof value === "number" ? value.toFixed(2) : "—";
}

function formatChange(value?: number | null): string {
  if (typeof value !== "number") return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatVolume(value?: number | null): string {
  if (typeof value !== "number") return "—";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="sparkline sparkline-empty" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

export function PulseBoard({ watchlist, onSelectTicker }: Props) {
  const sectorTabs = useMemo(() => {
    const sectors = Array.from(new Set(watchlist.map((item) => item.sector).filter(Boolean))) as string[];
    return ["All", ...sectors];
  }, [watchlist]);
  const [activeTab, setActiveTab] = useState("All");

  const visible = watchlist.filter((item) => activeTab === "All" || item.sector === activeTab);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Pulse board</h2>
        <p>Compact market cards with intraday range and day shape, filtered by sector when you want a tighter read.</p>
      </div>

      <div className="tab-strip">
        {sectorTabs.map((tab) => (
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

      <div className="pulse-grid">
        {visible.map((item) => {
          const rangeProgress =
            typeof item.price === "number" &&
            typeof item.day_low === "number" &&
            typeof item.day_high === "number" &&
            item.day_high > item.day_low
              ? ((item.price - item.day_low) / (item.day_high - item.day_low)) * 100
              : null;

          return (
            <button key={item.ticker} type="button" className="pulse-card pulse-card-button" onClick={() => onSelectTicker(item.ticker)}>
              <div className="pulse-card-top">
                <div>
                  <p className="eyebrow">{item.sector ?? "Market"}</p>
                  <h3>{item.ticker}</h3>
                  <p className="pulse-name">{item.name ?? "Unknown company"}</p>
                </div>
                <div className="pulse-price-block">
                  <strong>{formatPrice(item.price)}</strong>
                  <span className={typeof item.change_percent === "number" && item.change_percent >= 0 ? "positive" : "negative"}>
                    {formatChange(item.change_percent)}
                  </span>
                </div>
              </div>

              <div className="pulse-sparkline-wrap">
                <Sparkline values={item.sparkline ?? []} />
              </div>

              <div className="pulse-range">
                <div className="pulse-range-track">
                  <span style={{ width: `${rangeProgress ?? 50}%` }} />
                </div>
                <div className="pulse-range-labels">
                  <span>L {formatPrice(item.day_low)}</span>
                  <span>H {formatPrice(item.day_high)}</span>
                </div>
              </div>

              <div className="pulse-footer">
                <div>
                  <span>Volume</span>
                  <strong>{formatVolume(item.volume)}</strong>
                </div>
                <div>
                  <span>Avg volume</span>
                  <strong>{formatVolume(item.avg_volume)}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
