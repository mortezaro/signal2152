import { useEffect, useState } from "react";

import { getTickerOverview } from "../lib/api";
import type { QuoteSnapshot, TickerOverviewPayload } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMove(value?: number | null): string {
  if (typeof value !== "number") return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function MarketRegimeStrip({ watchlist }: Props) {
  const [indexData, setIndexData] = useState<Record<string, TickerOverviewPayload | null>>({});

  useEffect(() => {
    Promise.all([getTickerOverview("SPY"), getTickerOverview("QQQ"), getTickerOverview("^VIX")]).then(
      ([spy, qqq, vix]) => {
        setIndexData({ SPY: spy, QQQ: qqq, VIX: vix });
      },
    );
  }, []);

  const changes = watchlist.map((item) => item.change_percent).filter((value): value is number => typeof value === "number");
  const breadth = changes.filter((value) => value > 0).length / Math.max(changes.length, 1);
  const averageMove = average(changes);
  const dispersion = average(changes.map((value) => Math.abs(value)));
  const tone =
    breadth > 0.65 && averageMove > 0 && (indexData.VIX?.quote?.price ?? 0) < 24
      ? "Risk-on"
      : breadth < 0.4 && averageMove < 0
        ? "Risk-off"
        : "Balanced";

  return (
    <section className="regime-strip">
      <div className="regime-chip regime-chip-primary">
        <span>Regime</span>
        <strong>{tone}</strong>
      </div>
      <div className="regime-chip">
        <span>Breadth</span>
        <strong>{(breadth * 100).toFixed(0)}%</strong>
      </div>
      <div className="regime-chip">
        <span>SPY</span>
        <strong>{formatMove(indexData.SPY?.quote?.change_percent)}</strong>
      </div>
      <div className="regime-chip">
        <span>QQQ</span>
        <strong>{formatMove(indexData.QQQ?.quote?.change_percent)}</strong>
      </div>
      <div className="regime-chip">
        <span>VIX</span>
        <strong>
          {typeof indexData.VIX?.quote?.price === "number" ? indexData.VIX.quote.price.toFixed(2) : "—"}
        </strong>
      </div>
      <div className="regime-chip">
        <span>Dispersion</span>
        <strong>{dispersion.toFixed(2)}%</strong>
      </div>
    </section>
  );
}
