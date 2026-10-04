import {
  INIT_METHODS,
  IMPROVE_METHODS,
  PSEUDOCODE,
  methodLabel,
} from "../lib/methods.js";

function Block({ title, lines, phase, frame }) {
  const active = frame?.phase === phase ? frame.line : -1;
  const dim = frame && frame.phase !== phase;
  return (
    <div className="code-block" data-dim={dim}>
      <h3 className="code-title">{title}</h3>
      <ol className="code">
        {lines.map((text, i) => (
          <li key={i} data-active={i === active} aria-current={i === active}>
            {text}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Pseudocode({ initial, improve, frame }) {
  return (
    <section className="sec" aria-label="Pseudocode">
      <h2 className="sec-h">
        <span className="num">V</span> Pseudocode
      </h2>
      <Block
        title={`Fase 1 · ${methodLabel(INIT_METHODS, initial)}`}
        lines={PSEUDOCODE[initial]}
        phase="construct"
        frame={frame}
      />
      {improve !== "none" && (
        <Block
          title={`Fase 2 · ${methodLabel(IMPROVE_METHODS, improve)}`}
          lines={PSEUDOCODE[improve]}
          phase="improve"
          frame={frame}
        />
      )}
    </section>
  );
}
