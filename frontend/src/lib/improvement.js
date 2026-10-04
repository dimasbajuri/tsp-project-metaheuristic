// Improvement heuristics: 2-opt (steepest descent), Tabu Search, Simulated Annealing.
// Semua memakai neighborhood 2-opt yang sama dengan notebook. Setiap fungsi mengembalikan
// { route, cost, frames }.
import * as T from "./core.js";
const F = T.makeFrame;
const fmt = T.fmt;
const EPS = 1e-9;
const MAX_LEVEL_FRAMES = 3000;

const signed = (v) => (v >= 0 ? "+" : "") + fmt(v);
const moveText = (i, k) => `(${i}, ${k})`;

function startFrame(title, route, cost, desc) {
  return F({
    phase: "improve",
    line: 0,
    title,
    desc,
    route,
    cost,
    best: route,
    bestCost: cost,
  });
}

// ---------------------------------------------------------------- 2-opt
function twoOpt(ctx, initial, p) {
  const { d, lab } = ctx;
  const n = initial.length;
  let cur = initial;
  let cost = T.routeCost(cur, d);
  const frames = [
    startFrame(
      "Solusi awal untuk 2-opt",
      cur,
      cost,
      "Local search 2-opt: pilih move terbaik, ulangi sampai tidak ada perbaikan.",
    ),
  ];

  for (let pass = 1; pass <= p.maxPasses && n >= 4; pass++) {
    let bi = -1;
    let bk = -1;
    let bestDelta = -EPS;
    let evaluated = 0;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const delta = T.moveDelta(cur, d, i, k);
        evaluated++;
        if (delta < bestDelta) {
          bestDelta = delta;
          bi = i;
          bk = k;
        }
      }
    }

    if (bi < 0) {
      frames.push(
        F({
          phase: "improve",
          line: 3,
          title: "Optimum lokal tercapai",
          desc: `Dari ${evaluated} neighbor 2-opt tidak ada yang memperkecil cost.`,
          route: cur,
          cost,
          best: cur,
          bestCost: cost,
          metrics: [
            ["Pass", pass],
            ["Neighbor dievaluasi", evaluated],
          ],
        }),
      );
      break;
    }

    const e = T.moveEdges(cur, bi, bk);
    const [[a, b], [c, f]] = e.remove;
    frames.push(
      F({
        phase: "improve",
        line: 2,
        title: `Pass ${pass}: move terbaik ${moveText(bi, bk)}`,
        desc:
          `Dari ${evaluated} neighbor, hapus edge ${lab(a)}–${lab(b)} dan ${lab(c)}–${lab(f)}, ` +
          `ganti dengan ${lab(a)}–${lab(c)} dan ${lab(b)}–${lab(f)}. Δ cost = ${signed(bestDelta)}.`,
        route: cur,
        cost,
        best: cur,
        bestCost: cost,
        hl: { remove: e.remove, add: e.add },
        metrics: [
          ["Pass", pass],
          ["Neighbor dievaluasi", evaluated],
          ["Δ cost", signed(bestDelta)],
        ],
      }),
    );

    cur = T.reverseSegment(cur, bi, bk);
    cost = T.routeCost(cur, d);
    frames.push(
      F({
        phase: "improve",
        line: 4,
        title: `Pass ${pass}: segmen dibalik`,
        desc: `Segmen posisi ${bi}..${bk} dibalik. Cost menjadi ${fmt(cost)}.`,
        route: cur,
        cost,
        best: cur,
        bestCost: cost,
        hl: { add: e.add },
        metrics: [
          ["Pass", pass],
          ["Cost", fmt(cost)],
        ],
      }),
    );
  }
  return { route: cur, cost, frames };
}

// ---------------------------------------------------------------- Tabu Search
function tabuSearch(ctx, initial, p) {
  const { d, lab } = ctx;
  const n = initial.length;
  let cur = initial;
  let cost = T.routeCost(cur, d);
  let best = cur;
  let bestCost = cost;
  let tabu = [];
  const frames = [
    startFrame(
      "Solusi awal untuk Tabu Search",
      cur,
      cost,
      `Tabu tenure = ${p.tabuTenure}, maksimum iterasi = ${p.maxIterations}.`,
    ),
  ];
  frames[0].tabu = [];

  for (let it = 1; it <= p.maxIterations; it++) {
    let sel = null;
    let selCost = Infinity;
    let selTabu = false;
    let evaluated = 0;
    let blocked = 0;

    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const candCost = cost + T.moveDelta(cur, d, i, k);
        evaluated++;
        const isTabu = tabu.includes(`${i},${k}`);
        const aspiration = candCost < bestCost;
        if (isTabu && !aspiration) {
          blocked++;
          continue;
        }
        if (candCost < selCost) {
          selCost = candCost;
          sel = { i, k };
          selTabu = isTabu;
        }
      }
    }

    if (!sel) {
      frames.push(
        F({
          phase: "improve",
          line: 2,
          title: "Berhenti: tidak ada move yang diizinkan",
          desc:
            n < 4
              ? "Jumlah node terlalu sedikit untuk 2-opt."
              : "Semua neighbor berstatus tabu dan tidak memenuhi aspirasi.",
          route: cur,
          cost,
          best,
          bestCost,
          tabu: tabu.map((t) => `(${t})`),
        }),
      );
      break;
    }

    const e = T.moveEdges(cur, sel.i, sel.k);
    const next = T.reverseSegment(cur, sel.i, sel.k);
    const nextCost = T.routeCost(next, d);
    const delta = nextCost - cost;
    const key = `${sel.i},${sel.k}`;
    cur = next;
    cost = nextCost;
    tabu = p.tabuTenure > 0 ? [...tabu, key].slice(-p.tabuTenure) : [];
    const improved = cost < bestCost;
    if (improved) {
      best = cur;
      bestCost = cost;
    }

    const [[a, b], [c, f]] = e.remove;
    const notes = [];
    if (selTabu)
      notes.push("move tabu diterima karena aspirasi (menghasilkan best baru)");
    else if (delta > EPS)
      notes.push("move menaikkan cost (keluar dari optimum lokal)");
    if (improved) notes.push("best solution diperbarui");

    frames.push(
      F({
        phase: "improve",
        line: improved ? 5 : 4,
        title: `Iterasi ${it}: move ${moveText(sel.i, sel.k)}`,
        desc:
          `Dipilih neighbor terbaik yang tidak tabu. Edge ${lab(a)}–${lab(b)} & ${lab(c)}–${lab(f)} ` +
          `diganti ${lab(a)}–${lab(c)} & ${lab(b)}–${lab(f)}. Δ = ${signed(delta)}.` +
          (notes.length ? ` ${notes.join("; ")}.` : ""),
        route: cur,
        cost,
        best,
        bestCost,
        hl: { remove: e.remove, add: e.add },
        tabu: tabu.map((t) => `(${t})`),
        metrics: [
          ["Iterasi", `${it} / ${p.maxIterations}`],
          ["Cost sekarang", fmt(cost)],
          ["Cost terbaik", fmt(bestCost)],
          ["Neighbor dievaluasi", evaluated],
          ["Diblokir tabu", blocked],
        ],
      }),
    );
  }
  return { route: best, cost: bestCost, frames };
}

// ---------------------------------------------------------------- Simulated Annealing
function simulatedAnnealing(ctx, initial, p) {
  const { d, lab, rng } = ctx;
  const n = initial.length;
  let cur = initial;
  let cost = T.routeCost(cur, d);
  let best = cur;
  let bestCost = cost;
  const frames = [
    startFrame(
      "Solusi awal untuk Simulated Annealing",
      cur,
      cost,
      `T₀ = ${p.initialTemperature}, cooling = ${p.coolingRate}, T min = ${p.minTemperature}, ${p.iterationsPerTemperature} iterasi per suhu.`,
    ),
  ];

  const levels =
    p.initialTemperature > p.minTemperature
      ? Math.ceil(
          Math.log(p.minTemperature / p.initialTemperature) /
            Math.log(p.coolingRate),
        )
      : 0;
  const stride = Math.max(1, Math.ceil(levels / MAX_LEVEL_FRAMES));
  let temp = p.initialTemperature;
  let level = 0;

  while (temp > p.minTemperature && n >= 4) {
    level++;
    const detail = level <= p.detailLevels;
    const stat = { improved: 0, uphill: 0, rejected: 0 };

    for (let step = 1; step <= p.iterationsPerTemperature; step++) {
      const a = 1 + Math.floor(rng() * (n - 1));
      let b = 1 + Math.floor(rng() * (n - 2));
      if (b >= a) b++;
      const i = Math.min(a, b);
      const k = Math.max(a, b);
      const delta = T.moveDelta(cur, d, i, k);

      let accept = delta < 0;
      let prob = null;
      let roll = null;
      if (!accept) {
        prob = Math.exp(-delta / temp);
        roll = rng();
        accept = roll < prob;
      }

      const e = detail ? T.moveEdges(cur, i, k) : null;
      if (accept) {
        cur = T.reverseSegment(cur, i, k);
        cost += delta;
        if (delta < 0) stat.improved++;
        else stat.uphill++;
        if (cost < bestCost - EPS) {
          best = cur;
          bestCost = cost;
        }
      } else {
        stat.rejected++;
      }

      if (detail) {
        const verdict = accept
          ? delta < 0
            ? "lebih baik → diterima"
            : "lebih buruk, tapi diterima"
          : "lebih buruk → ditolak";
        const probText =
          prob === null
            ? ""
            : ` P = e^(−Δ/T) = ${fmt(prob, 3)}, acak = ${fmt(roll, 3)}.`;
        frames.push(
          F({
            phase: "improve",
            line: delta < 0 ? 3 : 4,
            title: `T = ${fmt(temp, 2)} · iterasi ${step}: move ${moveText(i, k)} ${accept ? "diterima" : "ditolak"}`,
            desc: `Δ = ${signed(delta)} (${verdict}).${probText} Edge ${lab(e.remove[0][0])}–${lab(e.remove[0][1])} & ${lab(e.remove[1][0])}–${lab(e.remove[1][1])}.`,
            route: cur,
            cost,
            best,
            bestCost,
            hl: { remove: e.remove, add: e.add, rejected: !accept },
            metrics: [
              ["Suhu", fmt(temp, 3)],
              ["Δ cost", signed(delta)],
              ["Cost sekarang", fmt(cost)],
              ["Cost terbaik", fmt(bestCost)],
            ],
          }),
        );
      }
    }

    if (!detail && level % stride === 0) {
      frames.push(
        F({
          phase: "improve",
          line: 6,
          title: `Suhu ${fmt(temp, 3)} (level ${level}${levels ? ` / ±${levels}` : ""})`,
          desc:
            `${p.iterationsPerTemperature} percobaan: ${stat.improved} lebih baik, ` +
            `${stat.uphill} lebih buruk tapi diterima, ${stat.rejected} ditolak.`,
          route: cur,
          cost,
          best,
          bestCost,
          metrics: [
            ["Suhu", fmt(temp, 3)],
            ["Cost sekarang", fmt(cost)],
            ["Cost terbaik", fmt(bestCost)],
            ["Diterima (lebih baik)", stat.improved],
            ["Diterima (lebih buruk)", stat.uphill],
            ["Ditolak", stat.rejected],
          ],
        }),
      );
    }
    temp *= p.coolingRate;
  }

  const finalCost = T.routeCost(best, d);
  frames.push(
    F({
      phase: "improve",
      line: 1,
      title: "Pendinginan selesai",
      desc: `Suhu mencapai T min. Solusi terbaik yang ditemukan memiliki cost ${fmt(finalCost)}.`,
      route: best,
      cost: finalCost,
      best,
      bestCost: finalCost,
      metrics: [
        ["Level suhu", level],
        ["Cost terbaik", fmt(finalCost)],
      ],
    }),
  );
  return { route: best, cost: finalCost, frames };
}
export const improvement = {
  two_opt: twoOpt,
  tabu_search: tabuSearch,
  simulated_annealing: simulatedAnnealing,
};
