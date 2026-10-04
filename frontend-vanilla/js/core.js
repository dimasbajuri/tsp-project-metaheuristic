// Fungsi dasar: RNG, jarak, biaya tour, move 2-opt, dan pembuat "frame" simulasi.
(function (T) {
  'use strict';

  // RNG deterministik supaya hasil bisa direproduksi lewat seed.
  T.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  T.distMatrix = (pts) =>
    pts.map((p) => pts.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));

  // Total jarak tour (kembali ke titik awal) — setara route_cost di notebook.
  T.routeCost = function (route, d) {
    let total = 0;
    for (let i = 0; i < route.length; i++) {
      total += d[route[i]][route[(i + 1) % route.length]];
    }
    return total;
  };

  T.pathCost = function (route, d) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) total += d[route[i]][route[i + 1]];
    return total;
  };

  // 2-opt: balik segmen route[i..k]. Mengembalikan array baru (immutable).
  T.reverseSegment = (route, i, k) => [
    ...route.slice(0, i),
    ...route.slice(i, k + 1).reverse(),
    ...route.slice(k + 1),
  ];

  // Selisih biaya move (i, k) tanpa membangun route baru.
  T.moveDelta = function (route, d, i, k) {
    const n = route.length;
    const a = route[i - 1];
    const b = route[i];
    const c = route[k];
    const e = route[(k + 1) % n];
    return d[a][c] + d[b][e] - d[a][b] - d[c][e];
  };

  // Edge yang dihapus / ditambah oleh move (i, k).
  T.moveEdges = function (route, i, k) {
    const n = route.length;
    const a = route[i - 1];
    const b = route[i];
    const c = route[k];
    const e = route[(k + 1) % n];
    return { remove: [[a, b], [c, e]], add: [[a, c], [b, e]] };
  };

  T.fmt = (v, digits = 2) => (Number.isFinite(v) ? v.toFixed(digits) : '–');

  T.makeFrame = (o) => ({
    phase: 'construct',
    title: '',
    desc: '',
    route: [],
    closed: true,
    cost: null,
    best: null,
    bestCost: null,
    hl: {},
    metrics: [],
    tabu: null,
    ...o,
  });
})((window.TSP = window.TSP || {}));
