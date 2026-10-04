import { HINTS, IMPROVE_METHODS, INIT_METHODS } from "../lib/methods.js";
import { PARAM_FIELDS } from "../lib/simulation.js";

const SEED_LABEL = "Seed acak (Arbitrary & SA)";

export default function MethodPanel({
  points,
  start,
  onStart,
  initial,
  onInitial,
  improve,
  onImprove,
  form,
  onForm,
  error,
  onRun,
}) {
  const fields = PARAM_FIELDS[improve] ?? [];
  const setField = (key) => (e) => onForm({ ...form, [key]: e.target.value });

  return (
    <>
      <section className="sec" aria-labelledby="h-method">
        <h2 className="sec-h" id="h-method">
          <span className="num">II</span> Metode
        </h2>

        <label className="field">
          <span>Constructive heuristic</span>
          <select value={initial} onChange={(e) => onInitial(e.target.value)}>
            {INIT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Node awal</span>
          <select
            value={Math.min(start, Math.max(0, points.length - 1))}
            onChange={(e) => onStart(Number(e.target.value))}
            disabled={!points.length}
          >
            {points.map((p, i) => (
              <option key={i} value={i}>
                {i} · {p.name || "tanpa nama"}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Improvement / metaheuristic</span>
          <select value={improve} onChange={(e) => onImprove(e.target.value)}>
            {IMPROVE_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">{HINTS[improve]}</p>
      </section>

      <section className="sec" aria-labelledby="h-param">
        <h2 className="sec-h" id="h-param">
          <span className="num">III</span> Parameter
        </h2>

        <div className="row2">
          {fields.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input
                value={form[f.key]}
                inputMode={f.int ? "numeric" : "decimal"}
                onChange={setField(f.key)}
              />
            </label>
          ))}
          <label className="field">
            <span>{SEED_LABEL}</span>
            <input
              value={form.seed}
              inputMode="numeric"
              onChange={setField("seed")}
            />
          </label>
        </div>

        <button type="button" className="btn btn-run" onClick={onRun}>
          Jalankan simulasi →
        </button>
        <p className="note" data-kind="err" role="alert">
          {error}
        </p>
      </section>
    </>
  );
}
