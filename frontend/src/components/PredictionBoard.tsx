import type { ModelSummary } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

function formatPrediction(value: number): string {
  return value.toFixed(3);
}

export function PredictionBoard({ summary }: Props) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-header">
          <h2>Leadership pocket</h2>
          <p>The strongest names in the current cross-section, reduced to one live score per ticker.</p>
        </div>
        <div className="prediction-list">
          {summary?.top_predictions?.map((row, index) => (
            <div key={`top-${row.ticker}`} className="prediction-row">
              <div className="prediction-primary">
                <span className="prediction-rank">#{index + 1}</span>
                <strong>{row.ticker}</strong>
              </div>
              <div className="prediction-secondary">
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(0)}%ile` : "—"}</span>
              </div>
              <div className="signal-bar">
                <span style={{ width: `${Math.max(10, (row.percentile ?? 0) * 100)}%` }} />
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>

      <div>
        <div className="panel-header">
          <h2>Lagging pocket</h2>
          <p>The weakest part of the same signal surface, useful for contrast and rotation reads.</p>
        </div>
        <div className="prediction-list">
          {summary?.bottom_predictions?.map((row, index) => (
            <div key={`bottom-${row.ticker}`} className="prediction-row">
              <div className="prediction-primary">
                <span className="prediction-rank">#{index + 1}</span>
                <strong>{row.ticker}</strong>
              </div>
              <div className="prediction-secondary">
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(0)}%ile` : "—"}</span>
              </div>
              <div className="signal-bar negative-bar">
                <span style={{ width: `${Math.max(10, (1 - (row.percentile ?? 1)) * 100)}%` }} />
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>
    </section>
  );
}
