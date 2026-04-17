import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
};

function metric(summary: ModelSummary, key: "ic_mean" | "ic_tstat"): string {
  const value = (summary.metrics?.test as Record<string, unknown> | undefined)?.[key];
  return typeof value === "number" ? value.toFixed(4) : "n/a";
}

export function ModelRoster({ models }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Model desk</h2>
        <p>Semi-live ridge and GBDT refreshes, plus research snapshots from deeper experiments.</p>
      </div>

      <div className="model-roster">
        {models.map((model) => (
          <div key={model.run_label ?? model.display_name} className="model-card">
            <div className="model-card-top">
              <span className="eyebrow">Model</span>
              <strong>{model.display_name ?? model.run_label ?? "Unnamed model"}</strong>
            </div>
            <div className="model-card-metrics">
              <div>
                <span>Test IC</span>
                <strong>{metric(model, "ic_mean")}</strong>
              </div>
              <div>
                <span>Test t-stat</span>
                <strong>{metric(model, "ic_tstat")}</strong>
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
