import type { QuoteSnapshot } from "../lib/types";

type Props = {
  sector: string | null;
  watchlist: QuoteSnapshot[];
  onClose: () => void;
  onSelectTicker: (ticker: string) => void;
};

export function SectorDrawer({ sector, watchlist, onClose, onSelectTicker }: Props) {
  if (!sector) return null;

  const names = watchlist
    .filter((item) => (item.sector ?? "Other") === sector)
    .sort((a, b) => (b.change_percent ?? -999) - (a.change_percent ?? -999));

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="ticker-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Sector drill-down</p>
            <h2>{sector}</h2>
            <p className="drawer-subtitle">Leaders and laggards inside this pocket right now.</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="fundamentals-sections">
          {names.map((item) => (
            <button key={item.ticker} type="button" className="heat-ticker" onClick={() => onSelectTicker(item.ticker)}>
              <span>{item.name ?? item.ticker}</span>
              <strong>{item.ticker}</strong>
              <em>
                {typeof item.change_percent === "number"
                  ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%`
                  : "—"}
              </em>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
