import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
  onSelectTicker: (ticker: string) => void;
};

type ConsensusRow = {
  ticker: string;
  mentions: number;
  score: number;
};

function buildConsensus(models: ModelSummary[]): ConsensusRow[] {
  const scores = new Map<string, { mentions: number; score: number }>();

  for (const model of models) {
    for (const row of model.top_predictions.slice(0, 5)) {
      const current = scores.get(row.ticker) ?? { mentions: 0, score: 0 };
      current.mentions += 1;
      current.score += row.prediction;
      scores.set(row.ticker, current);
    }
  }

  return [...scores.entries()]
    .map(([ticker, value]) => ({ ticker, mentions: value.mentions, score: value.score / value.mentions }))
    .filter((row) => row.mentions >= 2)
    .sort((a, b) => b.mentions - a.mentions || b.score - a.score)
    .slice(0, 6);
}

export function ModelConsensus({ models, onSelectTicker }: Props) {
  const rows = buildConsensus(models);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Consensus pocket</h2>
        <p>Names showing up repeatedly across the active model lineup, useful when you want a higher-confidence read.</p>
      </div>
      <div className="consensus-grid">
        {rows.map((row) => (
          <button key={row.ticker} type="button" className="consensus-card" onClick={() => onSelectTicker(row.ticker)}>
            <span className="eyebrow">{row.mentions} models agree</span>
            <strong>{row.ticker}</strong>
            <em>{row.score.toFixed(3)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
