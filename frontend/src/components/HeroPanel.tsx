import type { ModelSummary } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

function statusLabel(summary?: ModelSummary | null): string {
  if (!summary) return "No model";
  return summary.is_snapshot ? "Research Snapshot" : "Semi-live model";
}

export function HeroPanel({ summary }: Props) {
  const highlights = summary?.top_predictions?.slice(0, 4) ?? [];

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Market State Dashboard</p>
        <h1>Research-grade market data, live company context, and our alpha model in one place.</h1>
        <p className="hero-text">
          A dashboard-first product that merges Yahoo Finance breadth with the latest exported
          predictions from our latent market-state research stack.
        </p>
      </div>

      <div className="hero-metric-card">
        <p className="metric-label">{statusLabel(summary)}</p>
        <h2>{summary?.display_name ?? summary?.run_label ?? "No model loaded"}</h2>
        <div className="hero-meta-grid">
          <div>
            <span>Refresh</span>
            <strong>{summary?.refreshed_at ? new Date(summary.refreshed_at).toLocaleString() : "n/a"}</strong>
          </div>
          <div>
            <span>Signal date</span>
            <strong>{summary?.live_date ?? "Latest research window"}</strong>
          </div>
          <div>
            <span>Coverage</span>
            <strong>{summary?.top_predictions?.length ? "Equity cross-section" : "n/a"}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>{summary?.is_snapshot ? "Historical research" : "Semi-live refresh"}</strong>
          </div>
        </div>

        <div className="highlight-strip">
          {highlights.map((row) => (
            <div key={`hero-${row.ticker}`} className="highlight-chip">
              <span>{row.ticker}</span>
              <strong>{row.prediction.toFixed(3)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
