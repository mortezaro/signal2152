import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function MarketRegimeStrip({ watchlist }: Props) {
  const changes = watchlist.map((item) => item.change_percent).filter((value): value is number => typeof value === "number");
  const breadth = changes.filter((value) => value > 0).length / Math.max(changes.length, 1);
  const averageMove = average(changes);
  const dispersion = average(changes.map((value) => Math.abs(value)));
  const tone = breadth > 0.65 && averageMove > 0 ? "Risk-on" : breadth < 0.4 && averageMove < 0 ? "Risk-off" : "Mixed";

  return (
    <section className="regime-strip">
      <div className="regime-chip">
        <span>Regime</span>
        <strong>{tone}</strong>
      </div>
      <div className="regime-chip">
        <span>Breadth</span>
        <strong>{(breadth * 100).toFixed(0)}%</strong>
      </div>
      <div className="regime-chip">
        <span>Avg move</span>
        <strong>{averageMove >= 0 ? "+" : ""}{averageMove.toFixed(2)}%</strong>
      </div>
      <div className="regime-chip">
        <span>Dispersion</span>
        <strong>{dispersion.toFixed(2)}%</strong>
      </div>
    </section>
  );
}
