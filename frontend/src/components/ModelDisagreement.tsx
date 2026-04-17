import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
  onSelectTicker: (ticker: string) => void;
};

type DisagreementRow = {
  ticker: string;
  spread: number;
  appearances: number;
};

function buildDisagreement(models: ModelSummary[]): DisagreementRow[] {
  const map = new Map<string, number[]>();

  for (const model of models) {
    const rows = [...model.top_predictions.slice(0, 5), ...model.bottom_predictions.slice(0, 5)];
    for (const row of rows) {
      const current = map.get(row.ticker) ?? [];
      current.push(row.percentile ?? 0.5);
      map.set(row.ticker, current);
    }
  }

  return [...map.entries()]
    .map(([ticker, values]) => ({
      ticker,
      appearances: values.length,
      spread: Math.max(...values) - Math.min(...values),
    }))
    .filter((row) => row.appearances >= 2)
    .sort((a, b) => b.spread - a.spread)
    .slice(0, 6);
}

export function ModelDisagreement({ models, onSelectTicker }: Props) {
  const rows = buildDisagreement(models);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Disagreement pocket</h2>
        <p>Names where the lineup is least aligned, useful when you want to spot unstable or regime-sensitive reads.</p>
      </div>
      <div className="consensus-grid">
        {rows.map((row) => (
          <button key={row.ticker} type="button" className="consensus-card disagreement-card" onClick={() => onSelectTicker(row.ticker)}>
            <span className="eyebrow">{row.appearances} views tracked</span>
            <strong>{row.ticker}</strong>
            <em>spread {row.spread.toFixed(2)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
