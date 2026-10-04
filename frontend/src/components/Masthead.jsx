const THEME_LABEL = { light: "Terang", dark: "Gelap" };

export default function Masthead({ theme, onTheme, summary }) {
  return (
    <header className="masthead">
      <div>
        <p className="eyebrow">Metaheuristik · Lembar simulasi TSP</p>
        <h1>
          Atlas <em>Rute</em>
        </h1>
        <p className="lede">
          Menelusuri langkah demi langkah bagaimana heuristik membangun lalu
          memperbaiki tour Traveling Salesman.
        </p>
      </div>
      <div className="mast-side">
        <p className="eyebrow" aria-live="polite">
          {summary}
        </p>
        <button type="button" className="btn btn-sm" onClick={onTheme}>
          Tema: {THEME_LABEL[theme] ?? "Otomatis"}
        </button>
      </div>
    </header>
  );
}
