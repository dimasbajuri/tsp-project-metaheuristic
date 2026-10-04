// Input data: parsing Excel/CSV/teks, contoh data, dan template.
(function (T) {
  'use strict';

  const MAX_POINTS = 500;
  const X_HEAD = /^(x|lng|lon|long|longitude)$/i;
  const Y_HEAD = /^(y|lat|latitude)$/i;
  const NAME_HEAD = /^(name|nama|kota|city|label|node|id|titik)$/i;

  const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

  // rows: array of arrays (hasil sheet_to_json header:1 atau CSV) → { points, warnings }
  T.rowsToPoints = function (rows) {
    const warnings = [];
    const clean = rows.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ''));
    if (!clean.length) return { points: [], warnings: ['Data kosong.'] };

    let xCol = -1;
    let yCol = -1;
    let nameCol = -1;
    let body = clean;

    const head = clean[0].map((c) => String(c).trim());
    const looksHeader = head.some((c) => X_HEAD.test(c) || Y_HEAD.test(c) || NAME_HEAD.test(c));
    if (looksHeader) {
      xCol = head.findIndex((c) => X_HEAD.test(c));
      yCol = head.findIndex((c) => Y_HEAD.test(c));
      nameCol = head.findIndex((c) => NAME_HEAD.test(c));
      body = clean.slice(1);
    }
    if (xCol < 0 || yCol < 0) {
      const sample = body[0] || [];
      const numeric = sample.map((c, i) => (isNum(c) ? i : -1)).filter((i) => i >= 0);
      if (numeric.length < 2) return { points: [], warnings: ['Tidak ditemukan dua kolom angka (x dan y).'] };
      [xCol, yCol] = numeric;
      if (nameCol < 0) nameCol = sample.findIndex((c, i) => i !== xCol && i !== yCol && String(c).trim() !== '');
    }

    let skipped = 0;
    const points = [];
    for (const row of body) {
      if (!isNum(row[xCol]) || !isNum(row[yCol])) {
        skipped++;
        continue;
      }
      const name = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
      points.push({ name, x: Number(row[xCol]), y: Number(row[yCol]) });
    }
    if (skipped) warnings.push(`${skipped} baris dilewati karena x/y bukan angka.`);
    if (points.length > MAX_POINTS) {
      warnings.push(`Dibatasi ${MAX_POINTS} titik pertama (data berisi ${points.length}).`);
      points.length = MAX_POINTS;
    }
    return { points, warnings };
  };

  T.parseText = function (text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    const delim = [',', ';', '\t'].find((dm) => lines[0] && lines[0].includes(dm)) || /\s+/;
    return T.rowsToPoints(lines.map((l) => l.split(delim).map((c) => c.trim())));
  };

  T.parseFile = async function (file) {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      if (typeof XLSX === 'undefined') {
        throw new Error('Library Excel (SheetJS) gagal dimuat. Periksa koneksi internet atau gunakan file .csv.');
      }
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return T.rowsToPoints(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
    }
    return T.parseText(await file.text());
  };

  T.randomPoints = function (n, seed) {
    const rng = T.mulberry32(seed);
    return Array.from({ length: n }, () => ({
      name: '',
      x: Math.round(rng() * 1000) / 10,
      y: Math.round(rng() * 1000) / 10,
    }));
  };

  // Data contoh yang sama dengan notebook.
  T.notebookSample = () => [
    { name: 'Jakarta', x: 0, y: 0 },
    { name: 'Bandung', x: 2, y: 3 },
    { name: 'Yogyakarta', x: 5, y: 1 },
    { name: 'Surabaya', x: 6, y: 5 },
    { name: 'Malang', x: 8, y: 2 },
  ];

  T.templateCsv = () => 'nama,x,y\nJakarta,0,0\nBandung,2,3\nYogyakarta,5,1\nSurabaya,6,5\nMalang,8,2\n';
})((window.TSP = window.TSP || {}));
