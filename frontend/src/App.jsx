import { useCallback, useEffect, useState } from "react";
import Caption from "./components/Caption.jsx";
import DataEntry from "./components/DataEntry.jsx";
import Ledger from "./components/Ledger.jsx";
import Masthead from "./components/Masthead.jsx";
import MethodPanel from "./components/MethodPanel.jsx";
import Plate from "./components/Plate.jsx";
import Pseudocode from "./components/Pseudocode.jsx";
import Readout from "./components/Readout.jsx";
import Trace from "./components/Trace.jsx";
import Transport from "./components/Transport.jsx";
import { usePlayback } from "./hooks/usePlayback.js";
import { useTheme } from "./hooks/useTheme.js";
import { notebookSample } from "./lib/data.js";
import { IMPROVE_METHODS, INIT_METHODS, methodLabel } from "./lib/methods.js";
import { DEFAULT_FORM, parseForm, runSimulation } from "./lib/simulation.js";

const MAX_POINTS = 500;
const MIN_POINTS = 4;
const NO_FRAMES = [];
const FIELD_TAGS = /^(INPUT|TEXTAREA|SELECT)$/;

export default function App() {
  const { theme, cycle } = useTheme();
  const [points, setPoints] = useState(notebookSample);
  const [start, setStart] = useState(0);
  const [initial, setInitial] = useState("nearest_neighbor");
  const [improve, setImprove] = useState("tabu_search");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [sim, setSim] = useState(null);
  const [runs, setRuns] = useState([]);
  const [speed, setSpeed] = useState(8);
  const [view, setView] = useState({ showBest: true, labels: true });
  const [clickAdd, setClickAdd] = useState(false);
  const [error, setError] = useState("");

  const frames = sim?.frames ?? NO_FRAMES;
  const playback = usePlayback(frames.length, speed);
  const frame = frames[playback.idx] ?? null;

  const changePoints = useCallback(
    (next) => {
      setPoints(next.slice(0, MAX_POINTS));
      setStart((s) => Math.min(s, Math.max(0, next.length - 1)));
      setSim(null);
      setError("");
      playback.reset();
    },
    [playback.reset],
  );

  const run = () => {
    if (points.length < MIN_POINTS) {
      setError(`Minimal ${MIN_POINTS} titik agar neighborhood 2-opt bermakna.`);
      return;
    }
    const parsed = parseForm(improve, form);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError("");
    const out = runSimulation(points, {
      start: Math.min(start, points.length - 1),
      initial,
      improve,
      params: parsed.params,
    });
    setSim(out);
    setRuns((prev) => [...prev, out.result]);
    playback.restart();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (FIELD_TAGS.test(e.target.tagName) || !frames.length) return;
      if (e.key === " " && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        playback.toggle();
      } else if (e.key === "ArrowRight") playback.step(1);
      else if (e.key === "ArrowLeft") playback.step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [frames.length, playback.toggle, playback.step]);

  const summary = frames.length
    ? `${points.length} titik · langkah ${playback.idx + 1}/${frames.length}`
    : `${points.length} titik · belum dijalankan`;

  const meta = {
    plate: sim
      ? `PLATE ${String(runs.length).padStart(2, "0")} · N = ${points.length}`
      : `N = ${points.length}`,
    method: sim
      ? `${methodLabel(INIT_METHODS, sim.result.initial)} + ${methodLabel(IMPROVE_METHODS, sim.result.improve)}`.toUpperCase()
      : "BELUM ADA SIMULASI",
    step: frames.length
      ? `LANGKAH ${playback.idx + 1} / ${frames.length}`
      : "—",
  };

  return (
    <div className="app">
      <Masthead theme={theme} onTheme={cycle} summary={summary} />

      <main className="board">
        <aside className="rail rail-left" aria-label="Masukan dan metode">
          <DataEntry
            points={points}
            onPoints={changePoints}
            clickAdd={clickAdd}
            onClickAdd={setClickAdd}
          />
          <MethodPanel
            points={points}
            start={start}
            onStart={(s) => {
              setStart(s);
              setSim(null);
              playback.reset();
            }}
            initial={initial}
            onInitial={setInitial}
            improve={improve}
            onImprove={setImprove}
            form={form}
            onForm={setForm}
            error={error}
            onRun={run}
          />
        </aside>

        <section className="stage" aria-label="Visualisasi">
          <Plate
            points={points}
            frame={frame}
            start={start}
            showBest={view.showBest}
            labels={view.labels}
            clickAdd={clickAdd}
            onAddPoint={(p) =>
              points.length < MAX_POINTS && changePoints([...points, p])
            }
            meta={meta}
          />
          <Transport
            idx={playback.idx}
            total={frames.length}
            playing={playback.playing}
            playback={playback}
            speed={speed}
            onSpeed={setSpeed}
            view={view}
            onView={setView}
          />
          <Trace frames={frames} idx={playback.idx} onSeek={playback.seek} />
          <Caption frame={frame} idx={playback.idx} />
        </section>

        <aside
          className="rail rail-right"
          aria-label="Pembacaan dan pseudocode"
        >
          <Readout frame={frame} result={sim?.result ?? null} />
          <Pseudocode initial={initial} improve={improve} frame={frame} />
        </aside>
      </main>

      <Ledger result={sim?.result ?? null} runs={runs} points={points} />
    </div>
  );
}
