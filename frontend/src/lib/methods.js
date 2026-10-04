// Metadata metode: label, penjelasan singkat, dan pseudocode.
// Nomor baris pseudocode dirujuk oleh `frame.line` dari constructive.js / improvement.js.

export const INIT_METHODS = [
  { id: "nearest_neighbor", label: "Nearest Neighbor", short: "NN" },
  { id: "nearest_insertion", label: "Nearest Insertion", short: "NI" },
  { id: "farthest_neighbor", label: "Farthest Neighbor", short: "FN" },
  { id: "arbitrary", label: "Arbitrary (acak)", short: "ARB" },
];

export const IMPROVE_METHODS = [
  { id: "none", label: "Tanpa improvement", short: "—" },
  { id: "two_opt", label: "2-opt", short: "2-OPT" },
  { id: "tabu_search", label: "Tabu Search", short: "TS" },
  { id: "simulated_annealing", label: "Simulated Annealing", short: "SA" },
];

export const methodLabel = (list, id) =>
  list.find((m) => m.id === id)?.label ?? id;

export const HINTS = {
  none: "Hanya constructive heuristic. Tour dibangun satu kali, tanpa perbaikan.",
  two_opt:
    "Local search: tiap pass memilih move 2-opt terbaik, berhenti saat tidak ada yang memperkecil cost.",
  tabu_search:
    "Selalu ambil neighbor terbaik yang tidak tabu, walau cost naik. Move yang baru dipakai dilarang selama tenure; aspirasi mengizinkannya bila menghasilkan best baru.",
  simulated_annealing:
    "Ambil neighbor 2-opt acak. Terima bila lebih baik, atau bila lebih buruk dengan peluang e^(−Δ/T). Suhu T diturunkan bertahap.",
};

const GREEDY = [
  "route ← [start];  U ← semua node selain start",
  "selama U tidak kosong:",
  "    v ← node di U {PICK} dari node terakhir",
  "    tambahkan v ke route;  hapus v dari U",
  "tutup tour: kembali ke start",
];

export const PSEUDOCODE = {
  nearest_neighbor: GREEDY.map((l) => l.replace("{PICK}", "terdekat")),
  farthest_neighbor: GREEDY.map((l) => l.replace("{PICK}", "terjauh")),
  nearest_insertion: [
    "route ← [start, node terdekat dari start]",
    "selama masih ada node tersisa:",
    "    v ← node yang paling dekat dengan tour",
    "    sisipkan v di edge (a, b) dengan kenaikan cost terkecil",
  ],
  arbitrary: ["route ← permutasi acak dari semua node"],
  two_opt: [
    "route ← solusi awal",
    "ulangi:",
    "    cari move (i, k) dengan Δ cost paling negatif",
    "    bila tidak ada Δ < 0: berhenti (optimum lokal)",
    "    balik segmen route[i..k]",
  ],
  tabu_search: [
    "current ← best ← solusi awal;  tabu ← [ ]",
    "untuk tiap iterasi:",
    "    pilih neighbor 2-opt terbaik yang tidak tabu",
    "    (move tabu boleh bila lebih baik dari best: aspirasi)",
    "    current ← neighbor;  masukkan move ke tabu list",
    "    bila cost(current) < cost(best): best ← current",
  ],
  simulated_annealing: [
    "current ← best ← solusi awal;  T ← T₀",
    "selama T > T min:",
    "    ulangi N kali, ambil neighbor 2-opt acak:",
    "        bila Δ < 0: terima",
    "        selain itu: terima dengan peluang e^(−Δ/T)",
    "        perbarui best bila lebih baik",
    "    T ← T × cooling rate",
  ],
};
