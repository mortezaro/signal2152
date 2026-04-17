import type { EarningsEvent } from "../lib/types";

type Props = {
  events: EarningsEvent[];
  onSelectTicker: (ticker: string) => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "Date pending";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function EarningsSoonPanel({ events, onSelectTicker }: Props) {
  return (
    <section className="panel panel-compact">
      <div className="panel-header panel-header-tight">
        <h2>Earnings soon</h2>
        <p>Names with catalysts coming up, useful when short-horizon signals need an event overlay.</p>
      </div>

      <div className="earnings-grid">
        {events.map((event) => (
          <button
            key={`${event.ticker}-${event.earnings_date ?? "pending"}`}
            type="button"
            className="earnings-card"
            onClick={() => onSelectTicker(event.ticker)}
          >
            <span className="eyebrow">{event.sector ?? "Market"}</span>
            <strong>{event.ticker}</strong>
            <span>{formatDate(event.earnings_date)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
