// Penghubung UI: state, input data, menjalankan algoritma, dan pemutar frame.
(function (T) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const ICON_PLAY = 'M4 2v12l10-6z';
  const ICON_PAUSE = 'M3 2h4v12H3zM9 2h4v12H9z';
  const MAX_POINTS = 500;
  const MAX_SA_WORK = 5e6;
  const LOG_WINDOW = 10;

  const INIT_LABEL = {
    nearest_neighbor: 'Nearest Neighbor',
    nearest_insertion: 'Nearest Insertion',
    farthest_neighbor: 'Farthest Neighbor',
    arbitrary: 'Arbitrary',
  };
  const IMPROVE_LABEL = {
    none: '—',
    two_opt: '2-opt',
    tabu_search: 'Tabu Search',
    simulated_annealing: 'Simulated Annealing',
  };
  const HINTS = {
    none: 'Hanya constructive heuristic: tour dibangun sekali, tanpa perbaikan.',
    two_opt: 'Local search: setiap pass memilih move 2-opt terbaik sampai tidak ada yang memperkecil cost.',
    tabu_search: 'Selalu ambil neighbor terbaik yang tidak tabu (boleh naik cost); move yang baru dipakai dilarang selama tenure. Aspirasi: tabu boleh jika menghasilkan best baru.',
    simulated_annealing: 'Ambil neighbor 2-opt acak; terima jika lebih baik, atau jika lebih buruk dengan peluang e^(−Δ/T). Suhu T turun bertahap.',
  };

  const state = { points: [], frames: [], idx: 0, playing: false, result: null, runs: [] };
  const map = new T.MapView($('#map'));
  const chart = new T.ChartView($('#chart'));

  // ------------------------------------------------------------ util DOM
  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    kids.forEach((kid) => node.append(kid));
    return node;
  }

  function say(sel, text, kind) {
    const node = $(sel);
    node.textContent = text;
    node.className = `msg ${kind || ''}`;
  }

  const nameOf = (i) => state.points[i]?.name || String(i);
  const currentFrame = () => state.frames[state.idx] || null;
  const startNode = () => Number($('#m-start').value) || 0;

  // ------------------------------------------------------------ gambar ulang
  function redraw() {
    map.draw(state.points, currentFrame(), {
      showBest: $('#show-best').checked,
      labels: $('#show-labels').checked,
      start: startNode(),
    });
    chart.draw(state.frames, state.idx);
  }

  function renderInfo() {
    const f = currentFrame();
    const badge = $('#phase');
    const metrics = $('#f-metrics');
    metrics.replaceChildren();
    if (!f) {
      badge.textContent = 'Belum dijalankan';
      badge.className = 'badge';
      $('#f-title').textContent = 'Siap';
      $('#f-desc').textContent = 'Muat data, pilih metode, lalu tekan “Jalankan simulasi”.';
      $('#f-tabu').hidden = true;
      return;
    }
    badge.textContent = f.phase === 'construct' ? 'Fase 1 · Constructive' : 'Fase 2 · Improvement';
    badge.className = `badge ${f.phase === 'improve' ? 'improve' : ''}`;
    $('#f-title').textContent = f.title;
    $('#f-desc').textContent = f.desc;

    const rows = [...f.metrics];
    if (!rows.length && f.cost !== null) rows.push([f.closed ? 'Cost tour' : 'Panjang parsial', T.fmt(f.cost)]);
    rows.forEach(([k, v]) => metrics.append(el('div', {}, el('dt', { text: k }), el('dd', { text: String(v) }))));

    $('#f-tabu').hidden = f.tabu === null;
    const chips = $('#f-tabu-chips');
    chips.replaceChildren();
    if (f.tabu !== null) {
      if (!f.tabu.length) chips.append(el('span', { class: 'hint', text: 'kosong' }));
      f.tabu.forEach((t) => chips.append(el('span', { class: 'chip', text: t })));
    }
  }

  function renderLog() {
    const log = $('#log');
    log.replaceChildren();
    const from = Math.max(0, state.idx - LOG_WINDOW + 1);
    for (let i = from; i <= state.idx && i < state.frames.length; i++) {
      const li = el(
        'li',
        i === state.idx ? { 'aria-current': 'true' } : {},
        el('button', { type: 'button', onclick: () => goTo(i) }, el('span', { text: `#${i + 1}` }), el('span', { text: state.frames[i].title }))
      );
      log.append(li);
    }
    log.scrollTop = log.scrollHeight;
  }

  function updateControls() {
    const total = state.frames.length;
    const scrub = $('#scrub');
    scrub.max = String(Math.max(0, total - 1));
    scrub.value = String(state.idx);
    $('#counter').textContent = `${total ? state.idx + 1 : 0} / ${total}`;
    ['#b-first', '#b-prev', '#b-play', '#b-next', '#b-last', '#scrub'].forEach((s) => ($(s).disabled = !total));
    $('#ic-play').setAttribute('d', state.playing ? ICON_PAUSE : ICON_PLAY);
    $('#b-play').setAttribute('aria-label', state.playing ? 'Jeda' : 'Putar');
  }

  function goTo(i) {
    if (!state.frames.length) return;
    state.idx = Math.min(Math.max(0, i), state.frames.length - 1);
    updateControls();
    renderInfo();
    renderLog();
    redraw();
  }

  // ------------------------------------------------------------ playback
  let lastTs = 0;
  let acc = 0;

  function tick(ts) {
    if (!state.playing) return;
    acc += Math.min((ts - lastTs) / 1000, 0.25) * Number($('#speed').value);
    lastTs = ts;
    const steps = Math.floor(acc);
    if (steps > 0) {
      acc -= steps;
      goTo(state.idx + steps);
    }
    if (state.idx >= state.frames.length - 1) {
      pause();
      return;
    }
    requestAnimationFrame(tick);
  }

  function play() {
    if (!state.frames.length) return;
    if (state.idx >= state.frames.length - 1) goTo(0);
    state.playing = true;
    lastTs = performance.now();
    acc = 0;
    updateControls();
    requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    updateControls();
  }

  // ------------------------------------------------------------ data
  function resetSim() {
    pause();
    state.frames = [];
    state.idx = 0;
    state.result = null;
    renderResult();
    updateControls();
    renderInfo();
    renderLog();
    redraw();
  }

  function setPoints(points, note, kind) {
    state.points = points.slice(0, MAX_POINTS);
    renderTable();
    renderStart();
    resetSim();
    if (note) say('#data-msg', note, kind);
  }

  function renderStart() {
    const sel = $('#m-start');
    const keep = Math.min(Number(sel.value) || 0, Math.max(0, state.points.length - 1));
    sel.replaceChildren(...state.points.map((_, i) => el('option', { value: String(i), text: `${i} · ${nameOf(i)}` })));
    sel.value = String(keep);
  }

  function renderTable() {
    const body = $('#pts-body');
    body.replaceChildren();
    state.points.forEach((p, i) => {
      const edit = (key, type) =>
        el('input', {
          type,
          value: String(p[key]),
          'aria-label': `${key} titik ${i}`,
          ...(type === 'number' ? { step: 'any' } : {}),
          onchange: (e) => updatePoint(i, key, e.target.value, type, e.target),
        });
      body.append(
        el(
          'tr',
          {},
          el('td', { class: 'idx', text: String(i) }),
          el('td', {}, edit('name', 'text')),
          el('td', {}, edit('x', 'number')),
          el('td', {}, edit('y', 'number')),
          el('td', {}, el('button', { type: 'button', 'aria-label': `Hapus titik ${i}`, title: 'Hapus', text: '×', onclick: () => removePoint(i) }))
        )
      );
    });
  }

  function updatePoint(i, key, raw, type, input) {
    const value = type === 'number' ? Number(raw) : raw.trim();
    if (type === 'number' && (raw.trim() === '' || !Number.isFinite(value))) {
      input.value = String(state.points[i][key]);
      say('#data-msg', 'Nilai koordinat harus berupa angka.', 'err');
      return;
    }
    state.points = state.points.map((p, n) => (n === i ? { ...p, [key]: value } : p));
    renderStart();
    resetSim();
  }

  function removePoint(i) {
    setPoints(state.points.filter((_, n) => n !== i));
  }

  function loadResult(parsed, source) {
    if (!parsed.points.length) {
      say('#data-msg', parsed.warnings.join(' ') || 'Tidak ada titik yang valid.', 'err');
      return;
    }
    const warn = parsed.warnings.length ? ` ${parsed.warnings.join(' ')}` : '';
    setPoints(parsed.points, `${parsed.points.length} titik dimuat dari ${source}.${warn}`, warn ? 'warn' : 'ok');
  }

  async function loadFile(file) {
    if (!file) return;
    try {
      loadResult(await T.parseFile(file), file.name);
    } catch (err) {
      say('#data-msg', err.message || 'Gagal membaca file.', 'err');
    }
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const a = el('a', { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------ parameter & run
  function num(id, label, min, max, integer) {
    const v = Number($(id).value);
    if (!Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) {
      throw new Error(`${label} harus ${integer ? 'bilangan bulat ' : 'angka '}antara ${min} dan ${max}.`);
    }
    return v;
  }

  function readParams() {
    const improve = $('#m-improve').value;
    const p = {
      initial: $('#m-init').value,
      improve,
      start: startNode(),
      seed: num('#p-seed', 'Seed', 0, 4294967295, true),
    };
    if (improve === 'two_opt') p.maxPasses = num('#p-passes', 'Maks. pass', 1, 10000, true);
    if (improve === 'tabu_search') {
      p.maxIterations = num('#p-iter', 'Maks. iterasi', 1, 2000, true);
      p.tabuTenure = num('#p-tenure', 'Tabu tenure', 0, 100000, true);
    }
    if (improve === 'simulated_annealing') {
      p.initialTemperature = num('#p-t0', 'Suhu awal', 0.001, 1e9);
      p.minTemperature = num('#p-tmin', 'Suhu min', 1e-7, 1e9);
      p.coolingRate = num('#p-cool', 'Cooling rate', 0.5, 0.99999);
      p.iterationsPerTemperature = num('#p-ips', 'Iterasi per suhu', 1, 5000, true);
      p.detailLevels = num('#p-detail', 'Level detail', 0, 5, true);
      if (p.initialTemperature <= p.minTemperature) throw new Error('Suhu awal harus lebih besar dari suhu min.');
      const levels = Math.log(p.minTemperature / p.initialTemperature) / Math.log(p.coolingRate);
      if (levels * p.iterationsPerTemperature > MAX_SA_WORK) {
        throw new Error('Parameter SA terlalu berat. Naikkan suhu min/cooling rate atau kurangi iterasi per suhu.');
      }
    }
    return p;
  }

  function run() {
    const pts = state.points;
    if (pts.length < 4) {
      say('#run-msg', 'Minimal 4 titik agar neighborhood 2-opt bermakna.', 'err');
      return;
    }
    let params;
    try {
      params = readParams();
    } catch (err) {
      say('#run-msg', err.message, 'err');
      return;
    }
    pause();
    say('#run-msg', '');

    const ctx = {
      d: T.distMatrix(pts),
      start: params.start,
      lab: nameOf,
      rng: T.mulberry32(params.seed),
    };
    const t0 = performance.now();
    const built = T.constructive[params.initial](ctx);
    const initialCost = T.routeCost(built.route, ctx.d);
    const improved = params.improve === 'none' ? null : T.improvement[params.improve](ctx, built.route, params);
    const ms = performance.now() - t0;

    state.frames = built.frames.concat(improved ? improved.frames : []);
    state.result = {
      initial: params.initial,
      improve: params.improve,
      initialRoute: built.route,
      initialCost,
      finalRoute: improved ? improved.route : built.route,
      finalCost: improved ? improved.cost : initialCost,
      ms,
    };
    state.runs = [...state.runs, { ...state.result, n: pts.length }];
    renderResult();
    renderRuns();
    goTo(0);
    play();
  }

  // ------------------------------------------------------------ hasil
  const routeText = (route) => [...route, route[0]].map(nameOf).join(' → ');
  const gainOf = (r) => (r.initialCost > 0 ? ((r.initialCost - r.finalCost) / r.initialCost) * 100 : 0);

  function renderResult() {
    const box = $('#result');
    const r = state.result;
    box.replaceChildren();
    if (!r) {
      box.append(el('p', { class: 'hint', text: 'Belum ada hasil.' }));
      return;
    }
    const dl = el('dl');
    const add = (k, v, cls) => dl.append(el('dt', { text: k }), el('dd', { text: v, class: cls || '' }));
    add('Metode', `${INIT_LABEL[r.initial]} + ${IMPROVE_LABEL[r.improve]}`);
    add('Cost awal', T.fmt(r.initialCost));
    add('Cost akhir', T.fmt(r.finalCost), 'big');
    add('Perbaikan', `${T.fmt(gainOf(r), 1)}%`, 'good');
    add('Rute awal', routeText(r.initialRoute));
    add('Rute akhir', routeText(r.finalRoute));
    add('Waktu hitung', `${T.fmt(r.ms, 1)} ms`);
    box.append(
      dl,
      el('button', {
        type: 'button',
        text: 'Salin rute akhir',
        onclick: async (e) => {
          try {
            await navigator.clipboard.writeText(routeText(r.finalRoute));
            e.target.textContent = 'Tersalin ✓';
          } catch {
            e.target.textContent = 'Gagal menyalin';
          }
        },
      })
    );
  }

  function renderRuns() {
    const body = $('#runs-body');
    body.replaceChildren();
    state.runs.forEach((r, i) => {
      const cell = (text, cls) => el('td', { text: String(text), class: cls || '' });
      body.append(
        el(
          'tr',
          {},
          cell(i + 1),
          cell(INIT_LABEL[r.initial]),
          cell(IMPROVE_LABEL[r.improve]),
          cell(r.n, 'num'),
          cell(T.fmt(r.initialCost), 'num'),
          cell(T.fmt(r.finalCost), 'num'),
          cell(`${T.fmt(gainOf(r), 1)}%`, 'num'),
          cell(`${T.fmt(r.ms, 0)} ms`, 'num')
        )
      );
    });
  }

  // ------------------------------------------------------------ wiring
  function selectTab(id) {
    document.querySelectorAll('.tabs [role=tab]').forEach((t) => {
      const on = t.id === id;
      t.setAttribute('aria-selected', String(on));
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
  }

  function syncParamGroups() {
    const m = $('#m-improve').value;
    document.querySelectorAll('.group').forEach((g) => (g.hidden = g.dataset.for !== m));
    $('#m-hint').textContent = HINTS[m];
  }

  function bind() {
    document.querySelectorAll('.tabs [role=tab]').forEach((t) => t.addEventListener('click', () => selectTab(t.id)));
    $('#file').addEventListener('change', (e) => loadFile(e.target.files[0]));
    const drop = $('#drop');
    ['dragover', 'dragenter'].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add('over');
      })
    );
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      loadFile(e.dataTransfer.files[0]);
    });
    $('#btn-template').addEventListener('click', () => download('template-titik.csv', T.templateCsv()));
    $('#btn-paste').addEventListener('click', () => loadResult(T.parseText($('#paste').value), 'teks'));
    $('#btn-sample').addEventListener('click', () => setPoints(T.notebookSample(), '5 titik contoh dari notebook dimuat.', 'ok'));
    $('#btn-random').addEventListener('click', () => {
      try {
        const n = num('#rand-n', 'Jumlah titik', 4, 200, true);
        setPoints(T.randomPoints(n, num('#rand-seed', 'Seed', 0, 4294967295, true)), `${n} titik acak dibuat.`, 'ok');
      } catch (err) {
        say('#data-msg', err.message, 'err');
      }
    });
    $('#btn-clear').addEventListener('click', () => setPoints([], 'Data dikosongkan.'));

    $('#m-improve').addEventListener('change', syncParamGroups);
    $('#m-start').addEventListener('change', () => (state.frames.length ? resetSim() : redraw()));
    $('#btn-run').addEventListener('click', run);

    $('#b-first').addEventListener('click', () => goTo(0));
    $('#b-prev').addEventListener('click', () => goTo(state.idx - 1));
    $('#b-next').addEventListener('click', () => goTo(state.idx + 1));
    $('#b-last').addEventListener('click', () => {
      pause();
      goTo(state.frames.length - 1);
    });
    $('#b-play').addEventListener('click', () => (state.playing ? pause() : play()));
    $('#scrub').addEventListener('input', (e) => {
      pause();
      goTo(Number(e.target.value));
    });
    ['#show-best', '#show-labels'].forEach((s) => $(s).addEventListener('change', redraw));

    $('#map').addEventListener('click', (e) => {
      if (!$('#click-add').checked) return;
      if (state.points.length >= MAX_POINTS) {
        say('#data-msg', `Maksimum ${MAX_POINTS} titik.`, 'warn');
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const { x, y } = map.unproject(e.clientX - rect.left, e.clientY - rect.top);
      setPoints([...state.points, { name: '', x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }]);
    });

    document.addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !state.frames.length) return;
      if (e.key === ' ') {
        e.preventDefault();
        state.playing ? pause() : play();
      } else if (e.key === 'ArrowRight') goTo(state.idx + 1);
      else if (e.key === 'ArrowLeft') goTo(state.idx - 1);
    });

    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        redraw();
      });
    };
    window.addEventListener('resize', schedule);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', schedule);
  }

  bind();
  syncParamGroups();
  setPoints(T.notebookSample(), '5 titik contoh dari notebook dimuat.', 'ok');
})(window.TSP);
