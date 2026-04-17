import { useState } from "react";

import type { ModelSummary, PredictionRow } from "../lib/types";

type Props = {
  summary?: ModelSummary | null;
};

type TabKey = "leaders" | "laggards";

function formatPrediction(value: number): string {
  return value.toFixed(3);
}

function renderRow(row: PredictionRow, index: number, tone: "positive" | "negative") {
  const width =
    tone === "positive"
      ? Math.max(12, (row.percentile ?? 0) * 100)
      : Math.max(12, (1 - (row.percentile ?? 1)) * 100);

  return (
    <div key={`${tone}-${row.ticker}`} className="signal-tile">
      <div className="signal-tile-top">
        <span className="prediction-rank">#{index + 1}</span>
        <strong>{row.ticker}</strong>
      </div>
      <div className="signal-tile-score">
        <strong>{formatPrediction(row.prediction)}</strong>
        <span>{row.percentile != null ? `${(row.percentile * 100).toFixed(0)}%ile` : "—"}</span>
      </div>
      <div className={`signal-bar ${tone === "negative" ? "negative-bar" : ""}`}>
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function PredictionBoard({ summary }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("leaders");
  const rows = activeTab === "leaders" ? summary?.top_predictions ?? [] : summary?.bottom_predictions ?? [];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Signal board</h2>
        <p>Tabbed pockets of the cross-section so the page stays readable while still showing the current ranking texture.</p>
      </div>

      <div className="tab-strip">
        <button
          type="button"
          className={activeTab === "leaders" ? "tab-pill active" : "tab-pill"}
          onClick={() => setActiveTab("leaders")}
        >
          Leaders
        </button>
        <button
          type="button"
          className={activeTab === "laggards" ? "tab-pill active" : "tab-pill"}
          onClick={() => setActiveTab("laggards")}
        >
          Laggards
        </button>
      </div>

      <div className="signal-grid">
        {rows.length ? rows.map((row, index) => renderRow(row, index, activeTab === "leaders" ? "positive" : "negative")) : <p className="empty-copy">No signal rows yet.</p>}
      </div>
    </section>
  );
}
