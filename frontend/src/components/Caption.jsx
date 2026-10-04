export default function Caption({ frame, idx }) {
  if (!frame) {
    return (
      <div className="caption">
        <span className="fig">Gbr. —</span>
        <h2 className="cap-title">Siap dijalankan</h2>
        <p className="cap-desc">
          Muat data di kolom kiri, pilih metode, lalu tekan “Jalankan simulasi”.
        </p>
      </div>
    );
  }

  return (
    <div className="caption" aria-live="polite">
      <span className="fig">Gbr. {idx + 1}</span>
      <h2 className="cap-title">{frame.title}</h2>
      <p className="cap-desc">{frame.desc}</p>

      {frame.metrics.length > 0 && (
        <dl className="tokens">
          {frame.metrics.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {frame.tabu !== null && (
        <div className="tabu">
          <span>Tabu list</span>
          {frame.tabu.length ? (
            frame.tabu.map((t, i) => <code key={`${t}-${i}`}>{t}</code>)
          ) : (
            <i>kosong</i>
          )}
        </div>
      )}
    </div>
  );
}
