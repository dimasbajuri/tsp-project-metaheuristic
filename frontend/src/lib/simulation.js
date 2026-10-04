// Orkestrasi simulasi: validasi parameter form lalu jalankan constructive → improvement.
import * as T from "./core.js";
import { constructive } from "./constructive.js";
import { improvement } from "./improvement.js";

const MAX_SA_WORK = 5e6;
const MAX_SEED = 4294967295;

export const DEFAULT_FORM = {
  seed: "42",
  maxPasses: "100",
  maxIterations: "100",
  tabuTenure: "10",
  initialTemperature: "1000",
  minTemperature: "0.001",
  coolingRate: "0.995",
  iterationsPerTemperature: "100",
  detailLevels: "1",
};

const F = (key, label, min, max, int = false) => ({
  key,
  label,
  min,
  max,
  int,
});

export const PARAM_FIELDS = {
  none: [],
  two_opt: [F("maxPasses", "Maks. pass", 1, 10000, true)],
  tabu_search: [
    F("maxIterations", "Maks. iterasi", 1, 2000, true),
    F("tabuTenure", "Tabu tenure", 0, 100000, true),
  ],
  simulated_annealing: [
    F("initialTemperature", "Suhu awal T₀", 0.001, 1e9),
    F("minTemperature", "Suhu min", 1e-7, 1e9),
    F("coolingRate", "Cooling rate", 0.5, 0.99999),
    F("iterationsPerTemperature", "Iterasi / suhu", 1, 5000, true),
    F("detailLevels", "Level detail (0–5)", 0, 5, true),
  ],
};

const SEED_FIELD = F("seed", "Seed acak", 0, MAX_SEED, true);

function readField(field, raw) {
  const v = Number(raw);
  const bad =
    String(raw).trim() === "" ||
    !Number.isFinite(v) ||
    v < field.min ||
    v > field.max ||
    (field.int && !Number.isInteger(v));
  if (bad) {
    const kind = field.int ? "bilangan bulat" : "angka";
    return {
      error: `${field.label} harus ${kind} antara ${field.min} dan ${field.max}.`,
    };
  }
  return { value: v };
}

// → { params } atau { error }
export function parseForm(improve, form) {
  const params = {};
  for (const field of [SEED_FIELD, ...(PARAM_FIELDS[improve] ?? [])]) {
    const r = readField(field, form[field.key]);
    if (r.error) return { error: r.error };
    params[field.key] = r.value;
  }
  if (improve === "simulated_annealing") {
    if (params.initialTemperature <= params.minTemperature) {
      return { error: "Suhu awal harus lebih besar dari suhu min." };
    }
    const levels =
      Math.log(params.minTemperature / params.initialTemperature) /
      Math.log(params.coolingRate);
    if (levels * params.iterationsPerTemperature > MAX_SA_WORK) {
      return {
        error:
          "Parameter SA terlalu berat. Naikkan suhu min atau turunkan cooling rate / iterasi per suhu.",
      };
    }
  }
  return { params };
}

export function runSimulation(points, { start, initial, improve, params }) {
  const ctx = {
    d: T.distMatrix(points),
    start,
    lab: (i) => points[i]?.name || String(i),
    rng: T.mulberry32(params.seed),
  };
  const t0 = performance.now();
  const built = constructive[initial](ctx);
  const initialCost = T.routeCost(built.route, ctx.d);
  const improved =
    improve === "none" ? null : improvement[improve](ctx, built.route, params);
  const ms = performance.now() - t0;

  return {
    frames: improved ? built.frames.concat(improved.frames) : built.frames,
    result: {
      initial,
      improve,
      initialRoute: built.route,
      initialCost,
      finalRoute: improved ? improved.route : built.route,
      finalCost: improved ? improved.cost : initialCost,
      ms,
      n: points.length,
    },
  };
}
