import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
};

export function ModelRoster({ models }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Model desk</h2>
        <p>Mix of semi-live refresh models and deeper research snapshots. This is about signal character, not backtest bragging.</p>
      </div>

      <div className="model-roster">
        {models.map((model) => (
          <div key={model.run_label ?? model.display_name} className="model-card">
            <div className="model-card-top">
              <span className="eyebrow">{model.is_snapshot ? "Snapshot" : "Live"}</span>
              <strong>{model.display_name ?? model.run_label ?? "Unnamed model"}</strong>
            </div>
            <div className="model-card-metrics">
              <div>
                <span>Top ticker</span>
                <strong>{model.top_predictions?.[0]?.ticker ?? "n/a"}</strong>
              </div>
              <div>
                <span>Conviction</span>
                <strong>{typeof model.top_predictions?.[0]?.prediction === "number" ? model.top_predictions[0].prediction.toFixed(3) : "n/a"}</strong>
              </div>
            </div>
            <p className="model-card-meta">Live date: {model.live_date ?? "n/a"}</p>
            <p className="model-card-meta">Refreshed: {model.refreshed_at ?? "n/a"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
