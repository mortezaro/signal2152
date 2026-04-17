import type { ModelSummary } from "../lib/types";

type Props = {
  models: ModelSummary[];
};

function formatRefresh(value?: string | null): string {
  if (!value) return "n/a";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ModelRoster({ models }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Signal lineup</h2>
        <p>Different signal lenses reading the same market tape. Use this more like a mood board than a scorecard.</p>
      </div>

      <div className="model-roster">
        {models.map((model) => (
          <div key={model.run_label ?? model.display_name} className="model-card">
            <div className="model-card-top">
              <span className="eyebrow">{model.is_snapshot ? "Research" : "Refresh"}</span>
              <strong>{model.display_name ?? model.run_label ?? "Unnamed model"}</strong>
            </div>
            <div className="model-card-metrics">
              <div>
                <span>Lead name</span>
                <strong>{model.top_predictions?.[0]?.ticker ?? "n/a"}</strong>
              </div>
              <div>
                <span>Signal</span>
                <strong>
                  {typeof model.top_predictions?.[0]?.prediction === "number"
                    ? model.top_predictions[0].prediction.toFixed(3)
                    : "n/a"}
                </strong>
              </div>
            </div>
            <div className="model-card-footer">
              {model.live_date ? <span>{model.live_date}</span> : <span>Research window</span>}
              <span>Updated {formatRefresh(model.refreshed_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
