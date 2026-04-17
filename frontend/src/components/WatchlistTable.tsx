import type { QuoteSnapshot } from "../lib/types";

type Props = {
  watchlist: QuoteSnapshot[];
};

function formatNumber(value?: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function WatchlistTable({ watchlist }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Pulse board</h2>
        <p>Live watchlist snapshots for the core names we care about right now.</p>
      </div>

      <div className="table-wrap">
        <table className="watchlist-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Name</th>
              <th>Price</th>
              <th>Change %</th>
              <th>Sector</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((row) => (
              <tr key={row.ticker}>
                <td>{row.ticker}</td>
                <td>{row.name ?? "—"}</td>
                <td>{formatNumber(row.price)}</td>
                <td className={(row.change_percent ?? 0) >= 0 ? "positive" : "negative"}>
                  {formatNumber(row.change_percent)}
                </td>
                <td>{row.sector ?? "—"}</td>
                <td>{formatNumber(row.volume, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
