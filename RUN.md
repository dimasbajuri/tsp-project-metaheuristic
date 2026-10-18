# Cara Menjalankan Web di Localhost

Panduan singkat agar tampilan **Atlas Rute** (simulasi metaheuristik TSP) muncul di browser. Aplikasi webnya ada di folder `frontend/` (React + Vite).

## 1. Prasyarat

Butuh **Node.js 18 atau lebih baru** (disarankan 20+). Cek di terminal:

```bash
node -v
npm -v
```

Kalau muncul `command not found`, pasang Node.js (versi LTS) dari <https://nodejs.org>, atau di Mac: `brew install node`. Setelah itu tutup dan buka ulang terminal.

## 2. Jalankan

Buka terminal (di VS Code: *Terminal → New Terminal*), lalu:

```bash
# masuk ke folder repo ini, lalu ke folder aplikasi web
cd frontend

# pasang dependensi (cukup sekali)
npm install

# nyalakan server
npm run dev
```

Jika berhasil, terminal menampilkan:

```text
  VITE v6.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

**Buka alamat `Local` itu di browser** — tampilannya langsung muncul.

Biarkan terminal tetap terbuka selama web dipakai. Untuk **menghentikan** server, tekan `Ctrl + C` di terminal itu.

> Port tidak selalu 5173. Kalau sedang terpakai, Vite memilih port lain. Selalu pakai alamat yang tertulis di terminal Anda.

## 3. Menjalankan lagi di lain waktu

`npm install` tidak perlu diulang. Cukup:

```bash
cd frontend
npm run dev
```

Setelah `git pull` yang mengubah `package.json`, jalankan `npm install` sekali lagi.

## 4. Variasi

| Kebutuhan | Perintah (di folder `frontend`) |
|-----------|----------------------------------|
| Pakai port tertentu | `npm run dev -- --port 3000` |
| Buka dari HP / laptop lain di Wi-Fi yang sama | `npm run dev -- --host` (pakai alamat `Network` yang tampil) |
| Jalankan versi produksi | `npm run build`, lalu `npm run preview` (buka `http://localhost:4173`) |
| Jalankan uji otomatis | `npm test` |

## 5. Jika ada masalah

| Gejala | Solusi |
|--------|--------|
| `command not found: npm` atau `node` | Pasang Node.js (lihat bagian 1), lalu buka ulang terminal. |
| `ENOENT ... package.json` | Anda belum berada di folder `frontend`. Jalankan `cd frontend`. |
| `Cannot find module ...` | Dependensi belum terpasang. Jalankan `npm install` di folder `frontend`. |
| `npm install` gagal atau lama | Periksa internet. Hapus folder `node_modules`, lalu `npm install` lagi. |
| `Port 5173 is in use` | Vite biasanya pindah port otomatis. Atau pilih sendiri: `npm run dev -- --port 3000`. |
| Halaman putih kosong saat `index.html` diklik dua kali | Aplikasi tidak bisa dibuka lewat `file://`. Jalankan `npm run dev` dan buka alamat `http://localhost:...`. |
| `This site can't be reached` | Server sudah berhenti. Pastikan terminal `npm run dev` masih berjalan dan portnya sama. |
| Tampilan tidak berubah setelah edit kode | Pastikan `npm run dev` masih jalan, lalu muat ulang browser (`Cmd/Ctrl + Shift + R`). |

Masih gagal? Salin pesan error lengkap dari terminal (atau konsol browser: `F12` → *Console*) dan kirim saat bertanya.
