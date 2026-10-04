import { fmt } from "../lib/core.js";
import { IMPROVE_METHODS, INIT_METHODS, methodLabel } from "../lib/methods.js";

const gainOf = (r) =>
  r.initialCost > 0 ? ((r.initialCost - r.finalCost) / r.initialCost) * 100 : 0;

function routeText(route, points) {
  const name = (i) => points[i]?.name || String(i);
  return [...route, route[0]].map(name).join(" → ");
}

function Result({ result, points }) {
  if (!result) {
    return (
      <p className="hint">
        Belum ada hasil. Jalankan simulasi terlebih dahulu.
      </p>
    );
  }
  const copy = async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(routeText(result.finalRoute, points));
      btn.textContent = "Tersalin ✓";
    } catch {
      btn.textContent = "Gagal menyalin";
    }
  };
  return (
    <>
      <dl className="dl">
        <dt>Metode</dt>
        <dd>
          {methodLabel(INIT_METHODS, result.initial)} +{" "}
          {methodLabel(IMPROVE_METHODS, result.improve)}
        </dd>
        <dt>Cost awal</dt>
        <dd>{fmt(result.initialCost)}</dd>
        <dt>Cost akhir</dt>
        <dd className="final">{fmt(result.finalCost)}</dd>
        <dt>Perbaikan</dt>
        <dd className="tone-best">{fmt(gainOf(result), 1)}%</dd>
        <dt>Waktu hitung</dt>
        <dd>{fmt(result.ms, 1)} ms</dd>
      </dl>
      <p className="route-line">
        <span>Rute akhir</span>
        {routeText(result.finalRoute, points)}
      </p>
      <button type="button" className="btn btn-sm" onClick={copy}>
        Salin rute akhir
      </button>
    </>
  );
}

function Runs({ runs }) {
  if (!runs.length) {
    return (
      <p className="hint">
        Jalankan beberapa kombinasi untuk membandingkannya di sini.
      </p>
    );
  }
  const bestByN = new Map();
  runs.forEach((r) => {
    const cur = bestByN.get(r.n);
    if (cur === undefined || r.finalCost < cur) bestByN.set(r.n, r.finalCost);
  });
  return (
    <div
      className="runs-scroll"
      tabIndex={0}
      role="region"
      aria-label="Tabel perbandingan"
    >
      <table className="runs">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Konstruksi</th>
            <th scope="col">Perbaikan</th>
            <th scope="col" className="num">
              N
            </th>
            <th scope="col" className="num">
              Awal
            </th>
            <th scope="col" className="num">
              Akhir
            </th>
            <th scope="col" className="num">
              Δ%
            </th>
            <th scope="col" className="num">
              ms
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r, i) => (
            <tr key={i} data-best={r.finalCost === bestByN.get(r.n)}>
              <td>{i + 1}</td>
              <td>{methodLabel(INIT_METHODS, r.initial)}</td>
              <td>{methodLabel(IMPROVE_METHODS, r.improve)}</td>
              <td className="num">{r.n}</td>
              <td className="num">{fmt(r.initialCost)}</td>
              <td className="num">{fmt(r.finalCost)}</td>
              <td className="num">{fmt(gainOf(r), 1)}</td>
              <td className="num">{fmt(r.ms, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Ledger({ result, runs, points }) {
  return (
    <footer className="ledger">
      <section aria-labelledby="h-result">
        <h2 className="sec-h" id="h-result">
          <span className="num">VI</span> Hasil
        </h2>
        <Result result={result} points={points} />
      </section>
      <section aria-labelledby="h-runs">
        <h2 className="sec-h" id="h-runs">
          <span className="num">VII</span> Perbandingan run
        </h2>
        <Runs runs={runs} />
      </section>
    </footer>
  );
}
