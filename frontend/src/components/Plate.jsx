import { useMemo, useRef } from "react";
import { MARGIN, VIEW, axisTicks, makeProjection } from "../lib/projection.js";

const LABEL_LIMIT = 80;
const round2 = (v) => Math.round(v * 100) / 100;

function nodeRadius(n) {
  if (n > 100) return 3.2;
  if (n > 40) return 4.5;
  return 6;
}

function Chevron({ from, to }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (len < 36) return null;
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const deg = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return (
    <path
      className="chevron"
      d="M-4 -3.4 L2.6 0 L-4 3.4"
      transform={`translate(${mx} ${my}) rotate(${deg})`}
    />
  );
}

function Edges({ P, list, cls }) {
  return list.map(([a, b], i) =>
    P[a] && P[b] ? (
      <line
        key={`${cls}-${i}`}
        className={cls}
        x1={P[a][0]}
        y1={P[a][1]}
        x2={P[b][0]}
        y2={P[b][1]}
      />
    ) : null,
  );
}

const LEGEND = [
  ["tour", "Tour saat ini"],
  ["best", "Terbaik"],
  ["remove", "Edge dihapus"],
  ["add", "Edge baru"],
  ["reject", "Move ditolak"],
];

export default function Plate({
  points,
  frame,
  start,
  showBest,
  labels,
  clickAdd,
  onAddPoint,
  meta,
}) {
  const svgRef = useRef(null);
  const proj = useMemo(() => makeProjection(points), [points]);
  const P = useMemo(
    () => points.map((p) => [proj.x(p.x), proj.y(p.y)]),
    [points, proj],
  );
  const xt = useMemo(
    () => axisTicks(proj.bounds.minX, proj.bounds.maxX),
    [proj],
  );
  const yt = useMemo(
    () => axisTicks(proj.bounds.minY, proj.bounds.maxY),
    [proj],
  );

  const route = frame?.route ?? [];
  const hl = frame?.hl ?? {};
  const visited = useMemo(() => new Set(route), [route]);
  const tourEdges = route
    .map((a, i) => [a, route[(i + 1) % route.length]])
    .slice(0, frame?.closed ? route.length : route.length - 1);
  const best = frame?.best;
  const bestEdges =
    showBest && best && best !== route
      ? best.map((a, i) => [a, best[(i + 1) % best.length]])
      : [];

  const left = MARGIN.l;
  const right = VIEW.w - MARGIN.r;
  const top = MARGIN.t;
  const bottom = VIEW.h - MARGIN.b;
  const r = nodeRadius(points.length);

  const handlePointer = (e) => {
    if (!clickAdd) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const s = pt.matrixTransform(ctm.inverse());
    const w = proj.inverse(s.x, s.y);
    onAddPoint({ name: "", x: round2(w.x), y: round2(w.y) });
  };

  return (
    <figure className="plate">
      <svg
        ref={svgRef}
        className={`plate-svg${clickAdd ? " is-adding" : ""}`}
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        role="img"
        aria-label={`Peta ${points.length} titik${frame ? `, ${frame.title}` : ""}`}
        onPointerDown={handlePointer}
      >
        <rect
          className="pl-outer"
          x="8"
          y="8"
          width={VIEW.w - 16}
          height={VIEW.h - 16}
        />
        <rect
          className="pl-inner"
          x={left}
          y={top}
          width={right - left}
          height={bottom - top}
        />

        {xt.values.map((v) => (
          <g key={`x${v}`}>
            <line
              className="pl-grid"
              x1={proj.x(v)}
              x2={proj.x(v)}
              y1={top}
              y2={bottom}
            />
            <line
              className="pl-tick"
              x1={proj.x(v)}
              x2={proj.x(v)}
              y1={bottom}
              y2={bottom + 6}
            />
            <text
              className="pl-num"
              x={proj.x(v)}
              y={bottom + 20}
              textAnchor="middle"
            >
              {xt.label(v)}
            </text>
          </g>
        ))}
        {yt.values.map((v) => (
          <g key={`y${v}`}>
            <line
              className="pl-grid"
              x1={left}
              x2={right}
              y1={proj.y(v)}
              y2={proj.y(v)}
            />
            <line
              className="pl-tick"
              x1={left - 6}
              x2={left}
              y1={proj.y(v)}
              y2={proj.y(v)}
            />
            <text
              className="pl-num"
              x={left - 10}
              y={proj.y(v) + 3.5}
              textAnchor="end"
            >
              {yt.label(v)}
            </text>
          </g>
        ))}

        <Edges P={P} list={bestEdges} cls="edge-best" />
        <Edges P={P} list={hl.cands ?? []} cls="edge-cand" />
        <Edges P={P} list={tourEdges} cls="edge-tour" />
        {tourEdges.map(([a, b], i) =>
          P[a] && P[b] ? <Chevron key={`c${i}`} from={P[a]} to={P[b]} /> : null,
        )}
        <Edges P={P} list={hl.remove ?? []} cls="edge-remove" />
        <Edges
          P={P}
          list={hl.add ?? []}
          cls={hl.rejected ? "edge-reject" : "edge-add"}
        />

        {points.map((p, i) => {
          const [x, y] = P[i];
          const isCur = hl.nodes?.cur === i;
          const isPick = hl.nodes?.pick === i;
          const cls = [
            "node",
            !frame || visited.has(i) ? "visited" : "",
            isCur ? "cur" : "",
            isPick ? "pick" : "",
          ].join(" ");
          return (
            <g key={i}>
              {i === start && (
                <circle className="node-start" cx={x} cy={y} r={r + 5} />
              )}
              <circle
                className={cls}
                cx={x}
                cy={y}
                r={r + (isCur || isPick ? 2 : 0)}
              />
              {labels && points.length <= LABEL_LIMIT && (
                <text className="node-label" x={x + r + 6} y={y - r - 3}>
                  {p.name || i}
                </text>
              )}
            </g>
          );
        })}

        {!points.length && (
          <text
            className="pl-empty"
            x={VIEW.w / 2}
            y={VIEW.h / 2}
            textAnchor="middle"
          >
            Belum ada titik — muat data atau aktifkan “Klik peta”.
          </text>
        )}

        <g className="titleblock">
          <text x={left} y={bottom + 42}>
            {meta.plate}
          </text>
          <text x={left} y={bottom + 55}>
            {meta.method}
          </text>
          <text x={left} y={bottom + 68}>
            {meta.step}
          </text>
        </g>
      </svg>

      <figcaption className="legend" aria-hidden="true">
        {LEGEND.map(([cls, label]) => (
          <span key={cls} className={`lg lg-${cls}`}>
            <i />
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
