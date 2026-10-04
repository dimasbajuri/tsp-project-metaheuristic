import test from "node:test";
import assert from "node:assert/strict";
import { distMatrix, routeCost, moveDelta } from "./core.js";
import {
  notebookSample,
  randomPoints,
  parseText,
  rowsToPoints,
} from "./data.js";
import { DEFAULT_FORM, parseForm, runSimulation } from "./simulation.js";
import { PSEUDOCODE } from "./methods.js";

const sample = notebookSample();
const OPTIMUM_5 = 19.944535679688723;

function simulate(points, initial, improve, overrides = {}) {
  const parsed = parseForm(improve, { ...DEFAULT_FORM, ...overrides });
  assert.equal(parsed.error, undefined);
  return runSimulation(points, {
    start: 0,
    initial,
    improve,
    params: parsed.params,
  });
}

const isPermutation = (route, n) =>
  route.length === n &&
  [...route].sort((a, b) => a - b).every((v, i) => v === i);

test("nearest neighbor menghasilkan tour yang sama dengan notebook", () => {
  const { result } = simulate(sample, "nearest_neighbor", "none");
  assert.deepEqual(result.finalRoute, [0, 1, 2, 4, 3]);
  assert.ok(Math.abs(result.finalCost - 21.789181162467003) < 1e-9);
});

test("tabu search mencapai optimum pada contoh 5 kota", () => {
  const { result } = simulate(sample, "nearest_neighbor", "tabu_search");
  assert.ok(Math.abs(result.finalCost - OPTIMUM_5) < 1e-9);
});

test("setiap kombinasi metode menghasilkan permutasi valid dan tidak memperburuk cost", () => {
  const pts = randomPoints(25, 7);
  const d = distMatrix(pts);
  for (const initial of [
    "nearest_neighbor",
    "nearest_insertion",
    "farthest_neighbor",
    "arbitrary",
  ]) {
    for (const improve of ["two_opt", "tabu_search", "simulated_annealing"]) {
      const { result } = simulate(pts, initial, improve);
      const tag = `${initial}+${improve}`;
      assert.ok(isPermutation(result.finalRoute, pts.length), tag);
      assert.ok(result.finalCost <= result.initialCost + 1e-9, tag);
      assert.ok(
        Math.abs(routeCost(result.finalRoute, d) - result.finalCost) < 1e-6,
        tag,
      );
    }
  }
});

test("2-opt berhenti di optimum lokal", () => {
  const pts = randomPoints(30, 3);
  const { result } = simulate(pts, "arbitrary", "two_opt");
  const d = distMatrix(pts);
  const r = result.finalRoute;
  for (let i = 1; i < r.length - 1; i++) {
    for (let k = i + 1; k < r.length; k++) {
      assert.ok(moveDelta(r, d, i, k) >= -1e-9);
    }
  }
});

test("simulated annealing deterministik untuk seed yang sama", () => {
  const pts = randomPoints(20, 5);
  const a = simulate(pts, "nearest_neighbor", "simulated_annealing");
  const b = simulate(pts, "nearest_neighbor", "simulated_annealing");
  assert.deepEqual(a.result.finalRoute, b.result.finalRoute);
  assert.equal(a.frames.length, b.frames.length);
});

test("nomor baris pseudocode pada frame selalu valid", () => {
  const pts = randomPoints(12, 2);
  for (const [initial, improve] of [
    ["nearest_neighbor", "tabu_search"],
    ["nearest_insertion", "simulated_annealing"],
    ["farthest_neighbor", "two_opt"],
    ["arbitrary", "none"],
  ]) {
    const { frames } = simulate(pts, initial, improve);
    for (const f of frames) {
      const method = f.phase === "construct" ? initial : improve;
      assert.ok(Number.isInteger(f.line), `${method}: ${f.title}`);
      assert.ok(f.line < PSEUDOCODE[method].length, `${method}: ${f.title}`);
    }
  }
});

test("parseForm menolak parameter tidak valid", () => {
  assert.match(
    parseForm("tabu_search", { ...DEFAULT_FORM, maxIterations: "0" }).error,
    /Maks. iterasi/,
  );
  assert.match(
    parseForm("simulated_annealing", {
      ...DEFAULT_FORM,
      initialTemperature: "0.0005",
      minTemperature: "0.001",
    }).error,
    /Suhu awal/,
  );
  assert.match(
    parseForm("simulated_annealing", { ...DEFAULT_FORM, coolingRate: "1" })
      .error,
    /Cooling rate/,
  );
  assert.match(
    parseForm("two_opt", { ...DEFAULT_FORM, seed: "abc" }).error,
    /Seed/,
  );
});

test("parseText membaca header, tanpa header, dan melewati baris rusak", () => {
  const withHeader = parseText("nama,x,y\nA,1,2\nB,3,4\nbad,x,y");
  assert.equal(withHeader.points.length, 2);
  assert.equal(withHeader.points[0].name, "A");
  assert.equal(withHeader.warnings.length, 1);

  const bare = parseText("1;2\n3;4");
  assert.deepEqual(
    bare.points.map((p) => [p.x, p.y]),
    [
      [1, 2],
      [3, 4],
    ],
  );
});

test("rowsToPoints mengenali kolom lat/lng dan melaporkan data kosong", () => {
  const geo = rowsToPoints([
    ["kota", "lat", "lng"],
    ["Solo", -7.5, 110.8],
  ]);
  assert.deepEqual(geo.points[0], { name: "Solo", x: 110.8, y: -7.5 });
  assert.ok(rowsToPoints([]).warnings.length > 0);
});
