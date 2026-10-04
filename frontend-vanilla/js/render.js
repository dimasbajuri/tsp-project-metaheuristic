// Penggambaran canvas: peta tour (MapView) dan grafik konvergensi cost (ChartView).
(function (T) {
  'use strict';

  const PAD = 46;
  const DEFAULT_SPAN = 100;

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  class MapView {
    constructor(canvas) {
      this.canvas = canvas;
      this.tf = null;
      this.size = { w: 0, h: 0 };
    }

    // Transform dunia → layar (sumbu y dibalik agar seperti grafik kartesius).
    project(points) {
      const { w, h } = this.size;
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = points.length ? Math.min(...xs) : 0;
      const maxX = points.length ? Math.max(...xs) : DEFAULT_SPAN;
      const minY = points.length ? Math.min(...ys) : 0;
      const maxY = points.length ? Math.max(...ys) : DEFAULT_SPAN;
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;
      const s = Math.min((w - 2 * PAD) / spanX, (h - 2 * PAD) / spanY);
      const ox = (w - spanX * s) / 2;
      const oy = (h - spanY * s) / 2;
      this.tf = { minX, minY, s, ox, oy, h };
      return points.map((p) => [ox + (p.x - minX) * s, h - (oy + (p.y - minY) * s)]);
    }

    unproject(px, py) {
      if (!this.tf) this.project([]);
      const { minX, minY, s, ox, oy, h } = this.tf;
      return { x: (px - ox) / s + minX, y: (h - py - oy) / s + minY };
    }

    draw(points, frame, opts) {
      const { ctx, w, h } = fitCanvas(this.canvas);
      this.size = { w, h };
      const col = {
        bg: css('--canvas'),
        route: css('--route'),
        best: css('--good'),
        bad: css('--bad'),
        warn: css('--warn'),
        node: css('--node'),
        muted: css('--muted'),
        text: css('--text'),
        line: css('--line'),
      };
      ctx.fillStyle = col.bg;
      ctx.fillRect(0, 0, w, h);

      const P = this.project(points);
      if (!points.length) {
        ctx.fillStyle = col.muted;
        ctx.font = '14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Belum ada titik. Muat data atau klik peta untuk menambah titik.', w / 2, h / 2);
        return;
      }

      const line = (a, b, style) => {
        ctx.save();
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.width;
        ctx.globalAlpha = style.alpha ?? 1;
        ctx.setLineDash(style.dash || []);
        ctx.beginPath();
        ctx.moveTo(P[a][0], P[a][1]);
        ctx.lineTo(P[b][0], P[b][1]);
        ctx.stroke();
        ctx.restore();
      };

      const arrow = (a, b, color) => {
        const mx = (P[a][0] + P[b][0]) / 2;
        const my = (P[a][1] + P[b][1]) / 2;
        const ang = Math.atan2(P[b][1] - P[a][1], P[b][0] - P[a][0]);
        const len = Math.hypot(P[b][0] - P[a][0], P[b][1] - P[a][1]);
        if (len < 28) return;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(ang);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      const inRoute = new Set(frame ? frame.route : []);
      const hl = (frame && frame.hl) || {};

      if (frame) {
        if (opts.showBest && frame.best && frame.best !== frame.route) {
          const b = frame.best;
          for (let i = 0; i < b.length; i++) {
            line(b[i], b[(i + 1) % b.length], { color: col.best, width: 2, dash: [6, 5], alpha: 0.75 });
          }
        }
        (hl.cands || []).forEach(([a, b]) =>
          line(a, b, { color: col.muted, width: 1.25, dash: [3, 4], alpha: 0.7 })
        );

        const r = frame.route;
        const last = frame.closed ? r.length : r.length - 1;
        for (let i = 0; i < last; i++) {
          const a = r[i];
          const b = r[(i + 1) % r.length];
          line(a, b, { color: col.route, width: 2.6 });
          arrow(a, b, col.route);
        }
        (hl.remove || []).forEach(([a, b]) => line(a, b, { color: col.bad, width: 3.2, dash: [7, 5] }));
        (hl.add || []).forEach(([a, b]) =>
          line(a, b, hl.rejected ? { color: col.warn, width: 3, dash: [2, 5] } : { color: col.best, width: 3.6 })
        );
      }

      const showLabels = opts.labels && points.length <= 80;
      const radius = points.length > 100 ? 3.5 : points.length > 40 ? 5 : 7;
      const nodes = hl.nodes || {};
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      points.forEach((p, i) => {
        const [x, y] = P[i];
        const visited = !frame || inRoute.has(i);
        const isStart = i === opts.start;
        const special = nodes.pick === i ? col.warn : nodes.cur === i ? col.best : null;

        ctx.beginPath();
        ctx.arc(x, y, radius + (special ? 2 : 0), 0, Math.PI * 2);
        ctx.fillStyle = special || (frame && !visited ? col.bg : col.node);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = special || (visited && frame ? col.node : col.muted);
        ctx.stroke();

        if (isStart) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.lineWidth = 1.75;
          ctx.strokeStyle = col.text;
          ctx.stroke();
        }
        if (showLabels) {
          ctx.fillStyle = col.text;
          ctx.fillText(p.name || String(i), x + radius + 7, y - radius);
        }
      });
    }
  }

  class ChartView {
    constructor(canvas) {
      this.canvas = canvas;
    }

    draw(frames, idx) {
      const { ctx, w, h } = fitCanvas(this.canvas);
      const col = {
        cur: css('--route'),
        best: css('--good'),
        muted: css('--muted'),
        line: css('--line'),
        text: css('--text'),
      };
      ctx.clearRect(0, 0, w, h);

      const pts = [];
      frames.forEach((f, i) => {
        if (f.closed && f.cost !== null) pts.push({ i, cost: f.cost, best: f.bestCost ?? f.cost });
      });
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = col.muted;
      if (pts.length < 2) {
        ctx.textAlign = 'center';
        ctx.fillText('Grafik muncul setelah simulasi dijalankan.', w / 2, h / 2);
        return;
      }

      const L = 46;
      const R = 10;
      const Tp = 10;
      const B = 22;
      const all = pts.flatMap((p) => [p.cost, p.best]);
      let lo = Math.min(...all);
      let hi = Math.max(...all);
      if (hi - lo < 1e-9) hi = lo + 1;
      const pad = (hi - lo) * 0.08;
      lo -= pad;
      hi += pad;
      const maxI = Math.max(1, frames.length - 1);
      const X = (i) => L + (i / maxI) * (w - L - R);
      const Y = (v) => Tp + (1 - (v - lo) / (hi - lo)) * (h - Tp - B);

      ctx.strokeStyle = col.line;
      ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let g = 0; g <= 3; g++) {
        const v = lo + ((hi - lo) * g) / 3;
        ctx.beginPath();
        ctx.moveTo(L, Y(v));
        ctx.lineTo(w - R, Y(v));
        ctx.stroke();
        ctx.fillText(T.fmt(v, 1), L - 6, Y(v));
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('langkah', (L + w - R) / 2, h - 14);

      const path = (key, color, width) => {
        ctx.beginPath();
        pts.forEach((p, n) => (n ? ctx.lineTo(X(p.i), Y(p[key])) : ctx.moveTo(X(p.i), Y(p[key]))));
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      path('cost', col.cur, 1.4);
      path('best', col.best, 2.2);

      ctx.strokeStyle = col.text;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(X(idx), Tp);
      ctx.lineTo(X(idx), h - B);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  T.MapView = MapView;
  T.ChartView = ChartView;
})((window.TSP = window.TSP || {}));
