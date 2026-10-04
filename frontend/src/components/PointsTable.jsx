// Tabel titik yang bisa diedit. Perubahan disimpan saat field kehilangan fokus
// supaya mengetik angka desimal tidak memicu reset simulasi di tiap tombol.
export default function PointsTable({ points, onChange }) {
  const commit = (i, key, raw, input) => {
    const isNumber = key !== "name";
    const value = isNumber ? Number(raw) : raw.trim();
    if (isNumber && (raw.trim() === "" || !Number.isFinite(value))) {
      input.value = String(points[i][key]);
      return;
    }
    if (value === points[i][key]) return;
    onChange(points.map((p, n) => (n === i ? { ...p, [key]: value } : p)));
  };

  const cell = (p, i, key) => (
    <input
      key={`${key}:${p[key]}`}
      defaultValue={p[key]}
      inputMode={key === "name" ? "text" : "decimal"}
      aria-label={`${key} titik ${i}`}
      onBlur={(e) => commit(i, key, e.target.value, e.target)}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
    />
  );

  return (
    <div
      className="pts-wrap"
      tabIndex={0}
      role="region"
      aria-label="Daftar titik"
    >
      <table className="pts">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Nama</th>
            <th scope="col">x</th>
            <th scope="col">y</th>
            <th scope="col">
              <span className="sr-only">Hapus</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td className="idx">{i}</td>
              <td>{cell(p, i, "name")}</td>
              <td>{cell(p, i, "x")}</td>
              <td>{cell(p, i, "y")}</td>
              <td>
                <button
                  type="button"
                  className="del"
                  aria-label={`Hapus titik ${i}`}
                  onClick={() => onChange(points.filter((_, n) => n !== i))}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
