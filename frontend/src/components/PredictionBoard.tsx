import type { ModelSummary } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

function formatPrediction(value: number): string {
  return value.toFixed(4);
}

export function PredictionBoard({ summary }: Props) {
  return (
    <section className="panel split-panel">
      <div>
        <div className="panel-header">
          <h2>Top-ranked names</h2>
          <p>Highest predicted cross-sectional scores from the latest exported model run.</p>
        </div>
        <div className="prediction-list">
          {summary?.top_predictions?.map((row) => (
            <div key={`top-${row.ticker}`} className="prediction-row">
              <div>
                <strong>{row.ticker}</strong>
                <span>Rank {row.rank ?? "—"}</span>
              </div>
              <div>
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(1)}%ile` : "—"}</span>
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>

      <div>
        <div className="panel-header">
          <h2>Bottom-ranked names</h2>
          <p>Names the model currently views as weakest in the cross-section.</p>
        </div>
        <div className="prediction-list">
          {summary?.bottom_predictions?.map((row) => (
            <div key={`bottom-${row.ticker}`} className="prediction-row">
              <div>
                <strong>{row.ticker}</strong>
                <span>Rank {row.rank ?? "—"}</span>
              </div>
              <div>
                <strong>{formatPrediction(row.prediction)}</strong>
                <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(1)}%ile` : "—"}</span>
              </div>
            </div>
          )) ?? <p className="empty-copy">No model predictions configured yet.</p>}
        </div>
      </div>
    </section>
  );
}
