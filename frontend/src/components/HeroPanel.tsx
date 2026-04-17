import type { ModelSummary } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

function lensLabel(summary?: ModelSummary | null): string {
  if (!summary) return "Signal lens";
  return summary.is_snapshot ? "Research lens" : "Signal lens";
}

function formatRefresh(value?: string | null): string {
  if (!value) return "n/a";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function HeroPanel({ summary }: Props) {
  const highlights = summary?.top_predictions?.slice(0, 4) ?? [];

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Signal2152</p>
        <h1>Today&apos;s market map</h1>
        <p className="hero-text">
          Fast read on leadership, laggards, sector tone, and the live names sitting at the top of the board.
        </p>
      </div>

      <div className="hero-metric-card">
        <div className="hero-card-header">
          <div>
            <p className="metric-label">{lensLabel(summary)}</p>
            <h2>{summary?.display_name ?? summary?.run_label ?? "No model loaded"}</h2>
          </div>
          <div className="hero-timestamps">
            {summary?.live_date ? <span>{summary.live_date}</span> : null}
            {summary?.refreshed_at ? <span>Updated {formatRefresh(summary.refreshed_at)}</span> : null}
          </div>
        </div>

        <div className="hero-highlight-strip">
          {highlights.length ? (
            highlights.map((row, index) => (
              <div key={`hero-${row.ticker}`} className="highlight-chip">
                <span>{index === 0 ? "Lead" : `#${index + 1}`}</span>
                <strong>{row.ticker}</strong>
                <em>{row.prediction.toFixed(3)}</em>
              </div>
            ))
          ) : (
            <p className="empty-copy">No active signal names yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
