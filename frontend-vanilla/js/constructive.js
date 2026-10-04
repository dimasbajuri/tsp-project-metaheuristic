// Constructive heuristics: Nearest/Farthest Neighbor, Nearest Insertion, Arbitrary.
// Tiap fungsi mengembalikan { route, frames } — frames merekam proses langkah demi langkah.
(function (T) {
  'use strict';
  const F = T.makeFrame;
  const fmt = T.fmt;

  function listDistances(ctx, from, nodes) {
    const shown = nodes.slice(0, 6).map((u) => `${ctx.lab(u)}=${fmt(ctx.d[from][u])}`);
    return shown.join(', ') + (nodes.length > 6 ? ', …' : '');
  }

  function closeTour(ctx, route, frames) {
    const last = route[route.length - 1];
    frames.push(
      F({
        title: 'Tutup tour',
        desc: `Semua node sudah masuk. Kembali dari ${ctx.lab(last)} ke ${ctx.lab(route[0])}.`,
        route,
        closed: true,
        cost: T.routeCost(route, ctx.d),
        hl: { add: [[last, route[0]]] },
      })
    );
  }

  // far=false → Nearest Neighbor, far=true → Farthest Neighbor.
  function greedyNeighbor(ctx, far) {
    const { d, start, lab } = ctx;
    const n = d.length;
    const frames = [];
    let route = [start];
    let unvisited = [];
    for (let i = 0; i < n; i++) if (i !== start) unvisited.push(i);

    frames.push(
      F({
        title: `Mulai dari ${lab(start)}`,
        desc: 'Node awal dimasukkan ke tour. Node lain masih belum dikunjungi.',
        route,
        closed: false,
        cost: 0,
        hl: { nodes: { cur: start } },
      })
    );

    let cur = start;
    while (unvisited.length) {
      let pick = unvisited[0];
      for (const u of unvisited) {
        const better = far ? d[cur][u] > d[cur][pick] : d[cur][u] < d[cur][pick];
        if (better) pick = u;
      }
      const cands = unvisited.map((u) => [cur, u]);
      const listing = listDistances(ctx, cur, unvisited);
      route = [...route, pick];
      unvisited = unvisited.filter((u) => u !== pick);
      frames.push(
        F({
          title: `${far ? 'Terjauh' : 'Terdekat'} dari ${lab(cur)} → ${lab(pick)}`,
          desc:
            `Jarak ke node belum dikunjungi: ${listing}. ` +
            `Dipilih ${lab(pick)} (jarak ${fmt(d[cur][pick])}).`,
          route,
          closed: false,
          cost: T.pathCost(route, d),
          hl: { cands, add: [[cur, pick]], nodes: { cur: pick } },
        })
      );
      cur = pick;
    }
    closeTour(ctx, route, frames);
    return { route, frames };
  }

  function nearestInsertion(ctx) {
    const { d, start, lab } = ctx;
    const n = d.length;
    const frames = [];
    let remaining = [];
    for (let i = 0; i < n; i++) if (i !== start) remaining.push(i);

    let nearest = remaining[0];
    for (const u of remaining) if (d[start][u] < d[start][nearest]) nearest = u;
    let route = [start, nearest];
    remaining = remaining.filter((u) => u !== nearest);

    frames.push(
      F({
        title: `Sub-tour awal: ${lab(start)} ↔ ${lab(nearest)}`,
        desc: `Mulai dari ${lab(start)}, node terdekat adalah ${lab(nearest)} (jarak ${fmt(d[start][nearest])}).`,
        route,
        cost: T.routeCost(route, d),
        hl: { add: [[start, nearest]] },
      })
    );

    while (remaining.length) {
      // 1) node yang paling dekat dengan tour
      let node = remaining[0];
      let nodeDist = Infinity;
      let anchor = route[0];
      for (const cand of remaining) {
        for (const r of route) {
          if (d[cand][r] < nodeDist) {
            nodeDist = d[cand][r];
            node = cand;
            anchor = r;
          }
        }
      }
      frames.push(
        F({
          title: `Pilih ${lab(node)} (terdekat ke tour)`,
          desc: `${lab(node)} paling dekat ke tour, yaitu ke ${lab(anchor)} (jarak ${fmt(nodeDist)}).`,
          route,
          cost: T.routeCost(route, d),
          hl: { cands: [[node, anchor]], nodes: { pick: node } },
        })
      );

      // 2) posisi insertion dengan kenaikan cost terkecil
      let bestPos = 1;
      let bestInc = Infinity;
      let bestEdge = [route[0], route[1 % route.length]];
      for (let i = 0; i < route.length; i++) {
        const a = route[i];
        const b = route[(i + 1) % route.length];
        const inc = d[a][node] + d[node][b] - d[a][b];
        if (inc < bestInc) {
          bestInc = inc;
          bestPos = i + 1;
          bestEdge = [a, b];
        }
      }
      route = [...route.slice(0, bestPos), node, ...route.slice(bestPos)];
      remaining = remaining.filter((u) => u !== node);
      frames.push(
        F({
          title: `Sisipkan ${lab(node)} di antara ${lab(bestEdge[0])} dan ${lab(bestEdge[1])}`,
          desc:
            `Posisi terbaik menambah cost paling kecil: +${fmt(bestInc)}. ` +
            `Edge ${lab(bestEdge[0])}–${lab(bestEdge[1])} diganti ` +
            `${lab(bestEdge[0])}–${lab(node)}–${lab(bestEdge[1])}.`,
          route,
          cost: T.routeCost(route, d),
          hl: {
            remove: [bestEdge],
            add: [[bestEdge[0], node], [node, bestEdge[1]]],
            nodes: { pick: node },
          },
        })
      );
    }
    return { route, frames };
  }

  function arbitrary(ctx) {
    const { d, lab, rng } = ctx;
    const route = d.map((_, i) => i);
    for (let i = route.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [route[i], route[j]] = [route[j], route[i]];
    }
    const frames = [
      F({
        title: 'Solusi acak (arbitrary)',
        desc: `Urutan node diacak: ${route.map(lab).join(' → ')}.`,
        route,
        cost: T.routeCost(route, d),
      }),
    ];
    return { route, frames };
  }

  T.constructive = {
    nearest_neighbor: (ctx) => greedyNeighbor(ctx, false),
    farthest_neighbor: (ctx) => greedyNeighbor(ctx, true),
    nearest_insertion: nearestInsertion,
    arbitrary,
  };
})((window.TSP = window.TSP || {}));
