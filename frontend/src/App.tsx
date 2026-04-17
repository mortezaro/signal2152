import { useEffect, useState } from "react";

import { HeroPanel } from "./components/HeroPanel";
import { ModelRoster } from "./components/ModelRoster";
import { NewsRail } from "./components/NewsRail";
import { PredictionBoard } from "./components/PredictionBoard";
import { PulseBoard } from "./components/PulseBoard";
import { SectorPulse } from "./components/SectorPulse";
import { getDashboard } from "./lib/api";
import type { DashboardPayload } from "./lib/types";

export function App() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard().then(setData).catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="app-shell">
        <section className="error-panel">
          <h1>Dashboard offline</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <section className="loading-panel">
          <h1>Loading Signal2152…</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <HeroPanel summary={data.leaderboard} />
      <div className="dashboard-grid">
        <div className="dashboard-row dashboard-row-signal">
          <SectorPulse watchlist={data.watchlist} />
          <ModelRoster models={data.models} />
        </div>
        <PulseBoard watchlist={data.watchlist} />
        <PredictionBoard summary={data.leaderboard} />
        <NewsRail items={data.top_news} />
      </div>
    </main>
  );
}
