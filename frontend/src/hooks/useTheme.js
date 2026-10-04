import { useCallback, useEffect, useState } from "react";

const KEY = "atlas-theme";
const ORDER = [null, "light", "dark"];

function readStored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

// null = ikuti sistem, "light" / "dark" = pilihan manual.
export function useTheme() {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    try {
      if (theme) localStorage.setItem(KEY, theme);
      else localStorage.removeItem(KEY);
    } catch {
      /* penyimpanan diblokir: abaikan, tema tetap berlaku di sesi ini */
    }
  }, [theme]);

  const cycle = useCallback(
    () => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]),
    [],
  );
  return { theme, cycle };
}
