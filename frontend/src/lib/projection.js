// Proyeksi koordinat data → viewBox SVG (sumbu y dibalik seperti grafik kartesius).
export const VIEW = { w: 1000, h: 640 };
export const MARGIN = { l: 64, r: 34, t: 34, b: 82 };

const DEFAULT_SPAN = 100;

export function niceStep(span, target = 6) {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  const m = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return m * p;
}

export function makeProjection(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = points.length ? Math.min(...xs) : 0;
  const maxX = points.length ? Math.max(...xs) : DEFAULT_SPAN;
  const minY = points.length ? Math.min(...ys) : 0;
  const maxY = points.length ? Math.max(...ys) : DEFAULT_SPAN;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const innerW = VIEW.w - MARGIN.l - MARGIN.r;
  const innerH = VIEW.h - MARGIN.t - MARGIN.b;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const ox = MARGIN.l + (innerW - spanX * scale) / 2;
  const oy = MARGIN.t + (innerH - spanY * scale) / 2;
  const bottom = VIEW.h - MARGIN.b - (oy - MARGIN.t);

  return {
    bounds: { minX, maxX, minY, maxY },
    x: (wx) => ox + (wx - minX) * scale,
    y: (wy) => bottom - (wy - minY) * scale,
    inverse: (sx, sy) => ({
      x: (sx - ox) / scale + minX,
      y: (bottom - sy) / scale + minY,
    }),
  };
}

export function axisTicks(min, max) {
  const step = niceStep(max - min || 1);
  const values = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    values.push(Math.round(v / step) * step);
  }
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0;
  return { values, label: (v) => v.toFixed(decimals) };
}
