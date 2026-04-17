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
          <h2>Top-ranked names</h2>
          <p>Highest-conviction names from the latest signal surface, one score per ticker.</p>
        </div>
        <div className="prediction-list">
          {summary?.top_predictions?.map((row) => (
            <div key={`top-${row.ticker}`} className="prediction-row">
              <div>
                <strong>{row.ticker}</strong>
                <span>Long bias</span>
              </div>
              <div>
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(0)}%ile` : "—"}</span>
              </div>
              <div className="signal-bar">
                <span style={{ width: `${Math.max(8, (row.percentile ?? 0) * 100)}%` }} />
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>

      <div>
        <div className="panel-header">
          <h2>Bottom-ranked names</h2>
          <p>Names the model currently treats as weakest in the same cross-section.</p>
        </div>
        <div className="prediction-list">
          {summary?.bottom_predictions?.map((row) => (
            <div key={`bottom-${row.ticker}`} className="prediction-row">
              <div>
                <strong>{row.ticker}</strong>
                <span>Short bias</span>
              </div>
              <div>
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(0)}%ile` : "—"}</span>
              </div>
              <div className="signal-bar negative-bar">
                <span style={{ width: `${Math.max(8, (1 - (row.percentile ?? 1)) * 100)}%` }} />
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>
    </section>
  );
}
