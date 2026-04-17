import { useEffect, useState } from "react";

import { HeroPanel } from "./components/HeroPanel";
import { ModelRoster } from "./components/ModelRoster";
import { NewsRail } from "./components/NewsRail";
import { PredictionBoard } from "./components/PredictionBoard";
import { SignalNotes } from "./components/SignalNotes";
import { WatchlistTable } from "./components/WatchlistTable";
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
          <h1>Loading market state dashboard…</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <HeroPanel summary={data.leaderboard} />
      <div className="dashboard-grid">
        <ModelRoster models={data.models} />
        <WatchlistTable watchlist={data.watchlist} />
        <PredictionBoard summary={data.leaderboard} />
        <SignalNotes />
        <NewsRail items={data.top_news} />
      </div>
    </main>
  );
}
