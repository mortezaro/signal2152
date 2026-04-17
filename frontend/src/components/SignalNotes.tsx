export function SignalNotes() {
  return (
    <section className="panel notes-panel">
      <div className="panel-header">
        <h2>What makes this different</h2>
        <p>
          This dashboard is designed as a research surface, not an MCP utility and not a broker
          terminal clone.
        </p>
      </div>

      <div className="notes-grid">
        <div>
          <span className="eyebrow">Research first</span>
          <p>
            Our own latent market-state model sits beside market data, so ranking signals are part
            of the interface instead of being bolted on later.
          </p>
        </div>
        <div>
          <span className="eyebrow">Wide data surface</span>
          <p>
            Historical prices, company context, financial statements, options, and news all flow
            through the same backend contract.
          </p>
        </div>
        <div>
          <span className="eyebrow">Distinct visual identity</span>
          <p>
            The UI leans editorial and tactile, with warm materials, oversized typography, and a
            calmer layout than finance apps usually use.
          </p>
        </div>
      </div>
    </section>
  );
}
