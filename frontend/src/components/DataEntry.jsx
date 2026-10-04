import { useState } from "react";
import {
  notebookSample,
  parseFile,
  parseText,
  randomPoints,
  templateCsv,
} from "../lib/data.js";
import PointsTable from "./PointsTable.jsx";

const TABS = [
  ["file", "Berkas"],
  ["text", "Teks"],
  ["sample", "Contoh"],
];
const MAX_RANDOM = 200;
const MAX_SEED = 4294967295;

function downloadTemplate() {
  const url = URL.createObjectURL(
    new Blob([templateCsv()], { type: "text/csv" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-titik.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataEntry({ points, onPoints, clickAdd, onClickAdd }) {
  const [tab, setTab] = useState("file");
  const [note, setNote] = useState({
    text: "5 titik contoh dari notebook dimuat.",
    kind: "ok",
  });
  const [over, setOver] = useState(false);
  const [paste, setPaste] = useState("");
  const [rand, setRand] = useState({ n: "20", seed: "1" });

  const accept = (parsed, source) => {
    if (!parsed.points.length) {
      setNote({
        text: parsed.warnings.join(" ") || "Tidak ada titik yang valid.",
        kind: "err",
      });
      return;
    }
    const warn = parsed.warnings.join(" ");
    onPoints(parsed.points);
    setNote({
      text: `${parsed.points.length} titik dimuat dari ${source}.${warn ? ` ${warn}` : ""}`,
      kind: warn ? "warn" : "ok",
    });
  };

  const loadFile = async (file) => {
    if (!file) return;
    try {
      accept(await parseFile(file), file.name);
    } catch (err) {
      setNote({ text: err.message || "Gagal membaca berkas.", kind: "err" });
    }
  };

  const makeRandom = () => {
    const n = Number(rand.n);
    const seed = Number(rand.seed);
    if (!Number.isInteger(n) || n < 4 || n > MAX_RANDOM) {
      setNote({
        text: `Jumlah titik harus bilangan bulat 4–${MAX_RANDOM}.`,
        kind: "err",
      });
      return;
    }
    if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
      setNote({ text: "Seed harus bilangan bulat ≥ 0.", kind: "err" });
      return;
    }
    onPoints(randomPoints(n, seed));
    setNote({ text: `${n} titik acak dibuat.`, kind: "ok" });
  };

  return (
    <section className="sec" aria-labelledby="h-data">
      <h2 className="sec-h" id="h-data">
        <span className="num">I</span> Data masukan
      </h2>

      <div className="tabs" role="tablist" aria-label="Sumber data">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`pane-${id}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "file" && (
        <div id="pane-file" role="tabpanel" aria-labelledby="tab-file">
          <label
            className={`drop${over ? " over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              loadFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept=".xlsx,.csv,.txt"
              onChange={(e) => loadFile(e.target.files[0])}
            />
            <strong>Pilih atau seret berkas</strong>
            <span>.xlsx / .csv · kolom nama, x, y</span>
          </label>
          <button type="button" className="btn-text" onClick={downloadTemplate}>
            Unduh template CSV
          </button>
        </div>
      )}

      {tab === "text" && (
        <div id="pane-text" role="tabpanel" aria-labelledby="tab-text">
          <label className="field">
            <span>Satu titik per baris: nama,x,y</span>
            <textarea
              value={paste}
              spellCheck={false}
              placeholder={"Jakarta,0,0\nBandung,2,3\nYogyakarta,5,1"}
              onChange={(e) => setPaste(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => accept(parseText(paste), "teks")}
          >
            Muat data
          </button>
        </div>
      )}

      {tab === "sample" && (
        <div id="pane-sample" role="tabpanel" aria-labelledby="tab-sample">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onPoints(notebookSample());
              setNote({
                text: "5 titik contoh dari notebook dimuat.",
                kind: "ok",
              });
            }}
          >
            Lima kota dari notebook
          </button>
          <div className="row2 gap-top">
            <label className="field">
              <span>Titik acak</span>
              <input
                value={rand.n}
                inputMode="numeric"
                onChange={(e) => setRand({ ...rand, n: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Seed</span>
              <input
                value={rand.seed}
                inputMode="numeric"
                onChange={(e) => setRand({ ...rand, seed: e.target.value })}
              />
            </label>
          </div>
          <button type="button" className="btn btn-sm" onClick={makeRandom}>
            Buat titik acak
          </button>
        </div>
      )}

      <p className="note" data-kind={note.kind} role="status">
        {note.text}
      </p>

      <PointsTable points={points} onChange={onPoints} />

      <div className="row-between">
        <label className="check">
          <input
            type="checkbox"
            checked={clickAdd}
            onChange={(e) => onClickAdd(e.target.checked)}
          />
          Klik peta untuk menambah titik
        </label>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            onPoints([]);
            setNote({ text: "Data dikosongkan.", kind: "warn" });
          }}
        >
          Kosongkan
        </button>
      </div>
    </section>
  );
}
