import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
  onSelectTicker: (ticker: string) => void;
};

type DisagreementRow = {
  ticker: string;
  spread: number;
  appearances: number;
  signConflict: boolean;
};

function buildConsensusSet(models: ModelSummary[]): Set<string> {
  const counts = new Map<string, number>();
  for (const model of models) {
    for (const row of model.top_predictions.slice(0, 5)) {
      counts.set(row.ticker, (counts.get(row.ticker) ?? 0) + 1);
    }
  }
  return new Set([...counts.entries()].filter(([, count]) => count >= 2).map(([ticker]) => ticker));
}

function buildDisagreement(models: ModelSummary[]): DisagreementRow[] {
  const consensus = buildConsensusSet(models);
  const map = new Map<string, { percentiles: number[]; signs: Set<number>; appearances: number }>();

  for (const model of models) {
    for (const row of model.top_predictions.slice(0, 5)) {
      const current = map.get(row.ticker) ?? { percentiles: [], signs: new Set<number>(), appearances: 0 };
      current.percentiles.push(row.percentile ?? 0.5);
      current.signs.add(1);
      current.appearances += 1;
      map.set(row.ticker, current);
    }
    for (const row of model.bottom_predictions.slice(0, 5)) {
      const current = map.get(row.ticker) ?? { percentiles: [], signs: new Set<number>(), appearances: 0 };
      current.percentiles.push(row.percentile ?? 0.5);
      current.signs.add(-1);
      current.appearances += 1;
      map.set(row.ticker, current);
    }
  }

  return [...map.entries()]
    .map(([ticker, value]) => ({
      ticker,
      appearances: value.appearances,
      spread: Math.max(...value.percentiles) - Math.min(...value.percentiles),
      signConflict: value.signs.size > 1,
    }))
    .filter((row) => row.appearances >= 2 && row.signConflict && !consensus.has(row.ticker))
    .sort((a, b) => b.spread - a.spread)
    .slice(0, 6);
}

export function ModelDisagreement({ models, onSelectTicker }: Props) {
  const rows = buildDisagreement(models);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Disagreement pocket</h2>
        <p>Names that flip meaning across the lineup, which is more useful than simple low-confidence overlap.</p>
      </div>
      <div className="consensus-grid">
        {rows.map((row) => (
          <button key={row.ticker} type="button" className="consensus-card disagreement-card" onClick={() => onSelectTicker(row.ticker)}>
            <span className="eyebrow">{row.appearances} conflicting views</span>
            <strong>{row.ticker}</strong>
            <em>spread {row.spread.toFixed(2)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
