import type { ModelSummary } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

function formatMetric(value: unknown): string {
  if (typeof value === "number") {
    return value.toFixed(4);
  }
  return "n/a";
}

export function HeroPanel({ summary }: Props) {
  const testMetrics = (summary?.metrics?.test as Record<string, unknown> | undefined) ?? {};

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
        <p className="metric-label">Active model</p>
        <h2>{summary?.run_label ?? "No model loaded"}</h2>
        <p className="artifact-copy">{summary?.artifact_dir ?? "No artifact directory configured"}</p>
        <div className="metric-grid">
          <div>
            <span>Test IC</span>
            <strong>{formatMetric(testMetrics.ic_mean)}</strong>
          </div>
          <div>
            <span>Test t-stat</span>
            <strong>{formatMetric(testMetrics.ic_tstat)}</strong>
          </div>
          <div>
            <span>Train rows</span>
            <strong>{formatMetric((summary?.metrics?.train as Record<string, unknown> | undefined)?.n_rows)}</strong>
          </div>
          <div>
            <span>Validation IC</span>
            <strong>{formatMetric((summary?.metrics?.valid as Record<string, unknown> | undefined)?.ic_mean)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
