const SPEEDS = [1, 3, 8, 20, 60, 200];

const ICONS = {
  first: "M3 2h2v12H3zM14 2v12L6 8z",
  prev: "M12 2v12L4 8z",
  play: "M4 2v12l10-6z",
  pause: "M3 2h4v12H3zM9 2h4v12H9z",
  next: "M4 2v12l8-6z",
  last: "M11 2h2v12h-2zM2 2l8 6-8 6z",
};

function IconButton({ icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      className="tbtn"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d={ICONS[icon]} />
      </svg>
    </button>
  );
}

export default function Transport({
  idx,
  total,
  playing,
  playback,
  speed,
  onSpeed,
  view,
  onView,
}) {
  const none = total === 0;
  return (
    <div className="transport" role="toolbar" aria-label="Kontrol pemutar">
      <div className="tgroup">
        <IconButton
          icon="first"
          label="Ke awal"
          disabled={none}
          onClick={() => playback.seek(0)}
        />
        <IconButton
          icon="prev"
          label="Langkah mundur (←)"
          disabled={none}
          onClick={() => playback.step(-1)}
        />
        <IconButton
          icon={playing ? "pause" : "play"}
          label={playing ? "Jeda (spasi)" : "Putar (spasi)"}
          disabled={none}
          onClick={playback.toggle}
        />
        <IconButton
          icon="next"
          label="Langkah maju (→)"
          disabled={none}
          onClick={() => playback.step(1)}
        />
        <IconButton
          icon="last"
          label="Ke akhir"
          disabled={none}
          onClick={() => playback.seek(total - 1)}
        />
      </div>

      <p className="counter" aria-live="off">
        Langkah <b>{none ? 0 : idx + 1}</b> / {total}
      </p>

      <label className="inline-field">
        <span>Kecepatan</span>
        <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s} / dtk
            </option>
          ))}
        </select>
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={view.showBest}
          onChange={(e) => onView({ ...view, showBest: e.target.checked })}
        />
        Tour terbaik
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={view.labels}
          onChange={(e) => onView({ ...view, labels: e.target.checked })}
        />
        Label
      </label>
    </div>
  );
}
