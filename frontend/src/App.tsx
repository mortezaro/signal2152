import { useEffect, useState } from "react";

import { HeroPanel } from "./components/HeroPanel";
import { MarketBar } from "./components/MarketBar";
import { ModelDisagreement } from "./components/ModelDisagreement";
import { ModelConsensus } from "./components/ModelConsensus";
import { MarketRegimeStrip } from "./components/MarketRegimeStrip";
import { ModelRoster } from "./components/ModelRoster";
import { NewsRail } from "./components/NewsRail";
import { PredictionBoard } from "./components/PredictionBoard";
import { PulseBoard } from "./components/PulseBoard";
import { RotationBoard } from "./components/RotationBoard";
import { SectorDrawer } from "./components/SectorDrawer";
import { SectorHeatmap } from "./components/SectorHeatmap";
import { TickerDrawer } from "./components/TickerDrawer";
import { getDashboard } from "./lib/api";
import type { DashboardPayload } from "./lib/types";

export function App() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

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
      <MarketRegimeStrip watchlist={data.watchlist} />
      <MarketBar watchlist={data.watchlist} items={data.top_news} />
      <HeroPanel summary={data.leaderboard} />
      <div className="dashboard-grid">
        <div className="dashboard-row dashboard-row-signal">
          <SectorHeatmap watchlist={data.watchlist} onSelectTicker={setSelectedTicker} onSelectSector={setSelectedSector} />
          <div className="right-rail-stack">
            <ModelRoster models={data.models} />
            <RotationBoard watchlist={data.watchlist} />
            <div className="dashboard-row dashboard-row-dual">
              <ModelConsensus models={data.models} onSelectTicker={setSelectedTicker} />
              <ModelDisagreement models={data.models} onSelectTicker={setSelectedTicker} />
            </div>
          </div>
        </div>
        <PulseBoard watchlist={data.watchlist} onSelectTicker={setSelectedTicker} />
        <PredictionBoard summary={data.leaderboard} onSelectTicker={setSelectedTicker} />
        <NewsRail items={data.top_news} />
      </div>
      <TickerDrawer ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
      <SectorDrawer
        sector={selectedSector}
        watchlist={data.watchlist}
        onClose={() => setSelectedSector(null)}
        onSelectTicker={(ticker) => {
          setSelectedSector(null);
          setSelectedTicker(ticker);
        }}
      />
    </main>
  );
}
