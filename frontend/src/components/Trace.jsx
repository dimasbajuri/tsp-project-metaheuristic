import { useMemo } from "react";
import { fmt } from "../lib/core.js";

const W = 1000;
const H = 150;
const TAG_MIN_WIDTH = 100;
const PAD = { l: 52, r: 14, t: 18, b: 22 };

// Grafik cost yang sekaligus menjadi scrubber: klik atau seret untuk melompat ke langkah.
export default function Trace({ frames, idx, onSeek }) {
  const model = useMemo(() => {
    if (frames.length < 2) return null;
    const pts = [];
    frames.forEach((f, i) => {
      if (f.closed && f.cost !== null) {
        pts.push({ i, cost: f.cost, best: f.bestCost ?? f.cost });
      }
    });
    if (pts.length < 2) return null;
    const all = pts.flatMap((p) => [p.cost, p.best]);
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (hi - lo < 1e-9) hi = lo + 1;
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    const maxI = frames.length - 1;
    const X = (i) => PAD.l + (i / maxI) * (W - PAD.l - PAD.r);
    const Y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const line = (key) =>
      pts.map((p) => `${X(p.i).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(" ");
    const firstImprove = frames.findIndex((f) => f.phase === "improve");
    return {
      X,
      Y,
      lo,
      hi,
      cost: line("cost"),
      best: line("best"),
      firstImprove,
    };
  }, [frames]);

  if (!model) {
    return (
      <div className="trace trace-empty">
        Grafik cost muncul setelah simulasi dijalankan.
      </div>
    );
  }

  const { X, Y, lo, hi, firstImprove } = model;
  const seekFromPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (x - PAD.l) / (W - PAD.l - PAD.r);
    onSeek(Math.min(1, Math.max(0, frac)) * (frames.length - 1));
  };

  const cx = X(idx);
  const split = firstImprove > 0 ? X(firstImprove) : null;
  const current = frames[idx];

  return (
    <div className="trace">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Posisi langkah pada grafik cost"
        aria-valuemin={1}
        aria-valuemax={frames.length}
        aria-valuenow={idx + 1}
        aria-valuetext={`Langkah ${idx + 1} dari ${frames.length}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seekFromPointer(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e)}
      >
        {split !== null && (
          <rect
            className="tr-band"
            x={PAD.l}
            y={PAD.t}
            width={split - PAD.l}
            height={H - PAD.t - PAD.b}
          />
        )}
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}>
            <line
              className="tr-grid"
              x1={PAD.l}
              x2={W - PAD.r}
              y1={Y(v)}
              y2={Y(v)}
            />
            <text
              className="tr-num"
              x={PAD.l - 8}
              y={Y(v) + 3.5}
              textAnchor="end"
            >
              {fmt(v, 1)}
            </text>
          </g>
        ))}
        {split !== null && (
          <>
            {split - PAD.l > TAG_MIN_WIDTH && (
              <text className="tr-tag" x={PAD.l + 6} y={H - 6}>
                KONSTRUKSI
              </text>
            )}
            <text className="tr-tag" x={split + 6} y={H - 6}>
              PERBAIKAN
            </text>
          </>
        )}
        <polyline className="tr-cost" points={model.cost} />
        <polyline className="tr-best" points={model.best} />
        <line className="tr-cursor" x1={cx} x2={cx} y1={PAD.t} y2={H - PAD.b} />
        {current?.cost != null && current.closed && (
          <circle className="tr-dot" cx={cx} cy={Y(current.cost)} r="4" />
        )}
      </svg>
      <p className="trace-key">
        <span className="k-cost">— cost sekarang</span>
        <span className="k-best">— cost terbaik</span>
        <span>klik atau seret untuk melompat</span>
      </p>
    </div>
  );
}
