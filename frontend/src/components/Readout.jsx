import { fmt } from "../lib/core.js";

function Figure({ label, value, unit, tone }) {
  return (
    <div className="ro">
      <p className="ro-label">{label}</p>
      <p className={`ro-val${tone ? ` tone-${tone}` : ""}`}>
        {value === null ? "—" : value}
        {value !== null && unit && <small>{unit}</small>}
      </p>
    </div>
  );
}

export default function Readout({ frame, result }) {
  const cost = frame?.cost ?? null;
  const best = frame?.bestCost ?? null;
  const gain =
    result && best !== null && result.initialCost > 0
      ? ((result.initialCost - best) / result.initialCost) * 100
      : null;

  return (
    <section className="sec" aria-label="Pembacaan nilai">
      <h2 className="sec-h">
        <span className="num">IV</span> Pembacaan
      </h2>
      <Figure
        label={frame && !frame.closed ? "Panjang parsial" : "Cost sekarang"}
        value={cost === null ? null : fmt(cost)}
      />
      <Figure
        label="Cost terbaik"
        value={best === null ? null : fmt(best)}
        tone="best"
      />
      <Figure
        label="Perbaikan dari solusi awal"
        value={gain === null ? null : fmt(gain, 1)}
        unit="%"
        tone={gain > 0 ? "best" : null}
      />
    </section>
  );
}
