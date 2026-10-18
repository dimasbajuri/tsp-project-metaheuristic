# Help — Panduan Penggunaan Atlas Rute

**Atlas Rute** adalah aplikasi web untuk melihat *proses* metaheuristik menyelesaikan *Traveling Salesman Problem* (TSP): dari sekumpulan titik, cari tour terpendek yang melewati semua titik tepat satu kali lalu kembali ke titik awal.

Yang membedakan aplikasi ini dari sekadar kalkulator hasil: setiap langkah algoritma direkam dan bisa diputar ulang, lengkap dengan penjelasan alasan tiap langkah.

> Cara menjalankan aplikasi di localhost ada di [RUN.md](RUN.md). Dokumen ini membahas cara **memakai** aplikasinya.

## Daftar isi

1. [Alur singkat](#1-alur-singkat)
2. [Mengenal tampilan](#2-mengenal-tampilan)
3. [Memasukkan data](#3-memasukkan-data)
4. [Metode dan parameter](#4-metode-dan-parameter)
5. [Membaca visualisasi](#5-membaca-visualisasi)
6. [Hasil dan perbandingan](#6-hasil-dan-perbandingan)
7. [Pintasan keyboard](#7-pintasan-keyboard)
8. [Skenario demo yang disarankan](#8-skenario-demo-yang-disarankan)
9. [Tanya jawab (FAQ)](#9-tanya-jawab-faq)
10. [Batasan](#10-batasan)
11. [Glosarium](#11-glosarium)

---

## 1. Alur singkat

1. **Masukkan data** titik (Excel/CSV, tempel teks, contoh, atau klik di peta).
2. **Pilih metode:** satu *constructive heuristic* untuk membangun solusi awal, lalu (opsional) satu metode *improvement* untuk memperbaikinya.
3. **Atur parameter**, tekan **Jalankan simulasi →**.
4. **Tonton dan telusuri** prosesnya langkah demi langkah.
5. **Bandingkan** beberapa kombinasi metode pada tabel *Perbandingan run*.

## 2. Mengenal tampilan

Layar terbagi menjadi tiga kolom, dan satu bagian di bawah. Bagian-bagiannya bernomor romawi.

| Lokasi | Bagian | Fungsi |
|--------|--------|--------|
| Kiri | **I · Data masukan** | Memuat dan mengedit titik |
| Kiri | **II · Metode** | Memilih constructive heuristic, node awal, dan improvement |
| Kiri | **III · Parameter** | Mengatur parameter dan menjalankan simulasi |
| Tengah | **Peta** | Menggambar titik dan tour pada langkah yang sedang dilihat |
| Tengah | **Kontrol putar** | Putar, jeda, maju, mundur, kecepatan |
| Tengah | **Grafik cost** | Perkembangan cost; bisa diklik/diseret untuk melompat langkah |
| Tengah | **Keterangan gambar** | Penjelasan langkah yang sedang tampil |
| Kanan | **IV · Pembacaan** | Angka cost sekarang, terbaik, dan persentase perbaikan |
| Kanan | **V · Pseudocode** | Pseudocode metode; baris yang sedang dijalankan disorot |
| Bawah | **VI · Hasil** | Ringkasan run terakhir dan rute akhir |
| Bawah | **VII · Perbandingan run** | Tabel semua run dalam sesi ini |

Tombol **Tema** di pojok kanan atas bergantian antara *Otomatis* (ikut sistem), *Terang*, dan *Gelap*.

## 3. Memasukkan data

Bagian **I · Data masukan** punya tiga tab:

**Berkas** — unggah file `.xlsx` atau `.csv` (klik, atau seret ke kotak). Tersedia tautan *Unduh template CSV* untuk contoh formatnya.

**Teks** — tempel data langsung, satu titik per baris, lalu tekan *Muat data*:

```text
Jakarta,0,0
Bandung,2,3
Yogyakarta,5,1
```

**Contoh** — *Lima kota dari notebook* (data yang sama dengan `Algoritma.ipynb`), atau *Buat titik acak* dengan jumlah titik dan seed pilihan (4–200 titik). Seed yang sama selalu menghasilkan titik yang sama.

### Format file

```csv
nama,x,y
Jakarta,0,0
Bandung,2,3
Yogyakarta,5,1
Surabaya,6,5
Malang,8,2
```

- Baris pertama boleh header. Nama kolom yang dikenali: `nama`/`name`/`kota`/`city`/`label`/`node`/`id`/`titik` untuk nama titik; `x`, `lng`, `lon`, `long`, `longitude` untuk sumbu x; `y`, `lat`, `latitude` untuk sumbu y.
- Tanpa header, dua kolom angka pertama dipakai sebagai `x` dan `y`.
- Pemisah CSV: koma, titik koma, atau tab.
- Baris yang `x` atau `y`-nya bukan angka dilewati; jumlahnya dilaporkan di pesan di bawah area unggah.
- Format `.xls` lama tidak didukung; simpan ulang sebagai `.xlsx` atau `.csv`.

### Mengedit titik

- **Tabel titik:** ubah nama, `x`, atau `y` langsung di sel, lalu tekan `Enter` atau klik di luar sel untuk menyimpan. Tombol `×` menghapus titik.
- **Klik peta:** centang *Klik peta untuk menambah titik*, lalu klik di area peta.
- **Kosongkan:** menghapus semua titik.

> Setiap perubahan data atau node awal **mereset simulasi** yang sedang tampil, karena hasilnya sudah tidak sesuai dengan datanya. Tabel *Perbandingan run* tetap tersimpan.

## 4. Metode dan parameter

Simulasi berjalan dalam dua fase, sama seperti alur `solve_tsp` di notebook:

```text
titik  →  Fase 1: constructive heuristic  →  solusi awal  →  Fase 2: improvement (opsional)  →  solusi akhir
```

### Fase 1 — Constructive heuristic (membangun solusi awal)

Pilih salah satu. **Node awal** menentukan titik tempat tour dimulai.

| Metode | Cara kerja |
|--------|-----------|
| **Nearest Neighbor (NN)** | Dari node terakhir, selalu pindah ke node belum dikunjungi yang **terdekat**. Cepat, tetapi sering menyisakan lompatan jauh di akhir. |
| **Farthest Neighbor (FN)** | Sama seperti NN, tetapi memilih node yang **terjauh**. Biasanya menghasilkan tour awal yang buruk; berguna sebagai pembanding. |
| **Nearest Insertion (NI)** | Mulai dari dua node, lalu berulang: ambil node yang paling dekat dengan tour, **sisipkan** di edge yang menambah cost paling kecil. |
| **Arbitrary** | Urutan node diacak (dipengaruhi *seed*). Dipakai sebagai titik awal yang sengaja buruk. |

### Fase 2 — Improvement / metaheuristic (memperbaiki solusi)

Semuanya memakai *neighborhood* **2-opt**: sebuah **move (i, k)** membalik segmen tour dari posisi `i` sampai `k`. Efeknya, dua edge dihapus dan dua edge baru dibuat. Selisih cost move itu disebut **Δ**; Δ negatif berarti tour memendek.

| Metode | Ide |
|--------|-----|
| **Tanpa improvement** | Hanya fase 1. Hasil akhir = solusi awal. |
| **2-opt** | *Local search.* Tiap *pass*, pilih move dengan Δ paling negatif dan terapkan. Berhenti saat tak ada move yang memperbaiki (**optimum lokal**). |
| **Tabu Search** | Tiap iterasi, ambil neighbor terbaik yang **tidak tabu**, *walau cost naik*. Move yang baru dipakai dimasukkan ke **tabu list** dan dilarang selama beberapa iterasi agar pencarian tidak berputar-putar. **Aspirasi:** move tabu tetap boleh jika menghasilkan solusi terbaik baru. |
| **Simulated Annealing (SA)** | Ambil satu neighbor acak. Jika lebih baik → diterima. Jika lebih buruk → diterima dengan peluang **e^(−Δ/T)**. Suhu **T** diturunkan bertahap (`T ← T × cooling rate`), sehingga makin lama makin jarang menerima solusi buruk. |

### Parameter

Hanya parameter metode yang dipilih yang tampil. **Seed acak** selalu ada dan dipakai oleh *Arbitrary* dan *SA*. Seed yang sama + data yang sama = hasil yang sama persis.

| Metode | Parameter | Default | Rentang | Arti |
|--------|-----------|---------|---------|------|
| Semua | Seed acak | 42 | bilangan bulat 0 – 4.294.967.295 | Mengunci keacakan agar hasil bisa diulang |
| 2-opt | Maks. pass | 100 | 1 – 10.000 | Batas pengulangan pencarian move terbaik |
| Tabu Search | Maks. iterasi | 100 | 1 – 2.000 | Jumlah iterasi |
| Tabu Search | Tabu tenure | 10 | 0 – 100.000 | Berapa move terakhir yang dilarang. `0` = tabu list dimatikan |
| SA | Suhu awal T₀ | 1000 | 0,001 – 10⁹ | Suhu awal; makin tinggi, makin mudah menerima solusi buruk |
| SA | Suhu min | 0,001 | 10⁻⁷ – 10⁹ | Pendinginan berhenti saat suhu ≤ nilai ini. Harus lebih kecil dari T₀ |
| SA | Cooling rate | 0,995 | 0,5 – 0,99999 | Faktor pengali suhu tiap level; makin dekat 1, makin lambat dingin |
| SA | Iterasi / suhu | 100 | 1 – 5.000 | Jumlah percobaan neighbor di setiap level suhu |
| SA | Level detail | 1 | 0 – 5 | Berapa level suhu **pertama** yang ditampilkan per iterasi (untuk melihat keputusan terima/tolak satu per satu). Level berikutnya diringkas satu langkah per suhu |

Jika parameter tidak valid, pesan merah muncul di bawah tombol **Jalankan simulasi**. Parameter SA yang membuat perhitungan terlalu besar juga ditolak dengan pesan *"terlalu berat"*.

## 5. Membaca visualisasi

### Peta

Peta menggambar titik dengan sumbu x dan y (ada grid dan skala). Di kiri bawah ada *title block* berisi nomor plate (run ke-berapa), jumlah titik, metode, dan langkah saat ini.

**Garis**

| Tampilan | Arti |
|----------|------|
| Garis hitam tebal dengan panah | Tour saat ini, panah menunjukkan arah kunjungan |
| Garis hijau-teal putus-putus | Tour **terbaik** yang pernah ditemukan (bisa disembunyikan dengan *Tour terbaik*) |
| Garis merah putus-putus | Edge yang **dihapus** oleh move saat ini |
| Garis hijau-teal tebal | Edge **baru** hasil move |
| Garis kuning titik-titik | Move SA yang **ditolak** (edge yang *akan* dibuat tetapi tidak jadi) |
| Garis abu titik-titik | Kandidat yang sedang dibandingkan (pada NN/FN: jarak ke semua node belum dikunjungi) |

**Titik**

| Tampilan | Arti |
|----------|------|
| Titik penuh | Sudah masuk tour |
| Titik kosong | Belum dikunjungi (selama fase konstruksi) |
| Lingkaran ganda | Node awal |
| Titik merah | Node yang baru saja ditambahkan (NN/FN) |
| Titik kuning | Node yang dipilih untuk disisipkan (NI) |

Opsi **Label** menampilkan nama titik (otomatis disembunyikan jika titik lebih dari 80 agar tidak penuh).

### Kontrol putar

Tombol dari kiri ke kanan: ke awal, mundur satu langkah, putar/jeda, maju satu langkah, ke akhir. Pilihan **Kecepatan**: 1, 3, 8, 20, 60, atau 200 langkah per detik. Simulasi otomatis berputar sekali setelah dijalankan dan berhenti di langkah terakhir.

### Grafik cost (sekaligus *scrubber*)

- Garis abu = cost tour saat ini; garis teal = cost terbaik sejauh ini.
- Latar yang lebih gelap di sisi kiri = fase **KONSTRUKSI**; sisi kanan = fase **PERBAIKAN**.
- Garis vertikal merah = langkah yang sedang dilihat.
- **Klik atau seret** di grafik untuk langsung melompat ke langkah mana pun.
- Hanya tour yang sudah tertutup yang digambar; selama konstruksi NN/FN yang belum tertutup, titik cost-nya tidak muncul.

### Keterangan gambar

Di bawah grafik: nomor gambar (= nomor langkah), judul langkah, dan penjelasannya, misalnya jarak ke tiap kandidat, nilai Δ, peluang penerimaan SA, atau status aspirasi. Pada Tabu Search juga tampil **Tabu list** yang sedang berlaku.

### IV · Pembacaan

| Angka | Arti |
|-------|------|
| **Cost sekarang** | Panjang tour pada langkah ini. Selama konstruksi NN/FN yang belum tertutup, labelnya berubah menjadi **Panjang parsial** |
| **Cost terbaik** | Tour terpendek yang ditemukan hingga langkah ini |
| **Perbaikan dari solusi awal** | `(cost awal − cost terbaik) / cost awal`, dalam persen |

Cost dihitung sebagai **jarak Euclidean** dalam satuan yang sama dengan `x` dan `y` data Anda, dan tour dihitung **tertutup** (kembali ke titik awal).

### V · Pseudocode

Pseudocode metode terpilih ditampilkan. Pada setiap langkah, **baris yang sedang dijalankan disorot**; bagian fase yang sedang tidak aktif diredupkan. Ini cara paling cepat menghubungkan gambar di peta dengan algoritmanya.

## 6. Hasil dan perbandingan

**VI · Hasil** menampilkan run terakhir: metode, cost awal, cost akhir, persentase perbaikan, waktu hitung (milidetik), dan **rute akhir** dengan nama titik. Tombol *Salin rute akhir* menyalin rute ke clipboard.

**VII · Perbandingan run** mencatat setiap simulasi yang Anda jalankan selama halaman terbuka: konstruksi, perbaikan, jumlah titik, cost awal, cost akhir, persentase perbaikan, dan waktu. Baris berwarna hijau-teal adalah cost akhir **terendah untuk jumlah titik yang sama**. Tabel ini hilang jika halaman dimuat ulang.

## 7. Pintasan keyboard

Aktif setelah simulasi dijalankan, selama kursor tidak sedang di kolom isian:

| Tombol | Fungsi |
|--------|--------|
| `Spasi` | Putar / jeda |
| `→` | Maju satu langkah |
| `←` | Mundur satu langkah |

## 8. Skenario demo yang disarankan

**A. Memahami satu metode (5 kota)**
1. Tab *Contoh* → *Lima kota dari notebook*.
2. Nearest Neighbor + Tabu Search, parameter default → *Jalankan simulasi*.
3. Perlambat ke 1–3 langkah/detik, perhatikan edge merah (dihapus) dan hijau (baru), serta tabu list yang terisi.
4. Hasil akhir bernilai 19,94 — sama dengan solusi optimum untuk data ini.

**B. Membandingkan metode (20 titik acak)**
1. Tab *Contoh* → 20 titik, seed 1 → *Buat titik acak*.
2. Jalankan berturut-turut: *NN tanpa improvement*, *NN + 2-opt*, *NN + Tabu Search*, *NI + Simulated Annealing*.
3. Lihat tabel *Perbandingan run*; baris hijau adalah yang terbaik.

**C. Melihat 2-opt memperbaiki solusi buruk**
Pilih *Arbitrary* + *2-opt*. Tour awal acak berantakan; saksikan garis yang bersilangan hilang satu per satu.

**D. Memahami keputusan terima/tolak Simulated Annealing**
Pilih *SA* dengan *Level detail = 2*. Pada level awal, tiap percobaan tampil satu per satu beserta Δ, peluang, dan angka acaknya. Lalu perhatikan grafik: cost sekarang berfluktuasi tinggi saat suhu tinggi, lalu mengerucut saat suhu turun.

## 9. Tanya jawab (FAQ)

**Kenapa cost pada Tabu Search kadang naik?**
Itu disengaja. Tabu Search memilih neighbor terbaik yang tidak tabu *walau lebih buruk dari tour sekarang*, supaya bisa keluar dari optimum lokal. Yang dijaga adalah garis **cost terbaik**, yang tidak pernah naik.

**Kenapa hasil Simulated Annealing berbeda dengan notebook Python?**
Logika algoritmanya sama, tetapi generator bilangan acak di web dan di notebook (NumPy) berbeda, jadi urutan move acaknya tidak identik. Hasil yang dihasilkan web tetap konsisten untuk seed yang sama.

**Kenapa "Perbaikan" 0%?**
Solusi awalnya sudah berupa optimum lokal untuk neighborhood 2-opt, atau jumlah titiknya sangat sedikit. Coba constructive yang lebih buruk (*Farthest Neighbor* atau *Arbitrary*) untuk melihat efek improvement.

**Kenapa Tabu Search berhenti sebelum iterasi maksimum?**
Hanya jika semua neighbor berstatus tabu dan tidak memenuhi aspirasi, atau titik terlalu sedikit untuk 2-opt. Langkah terakhir akan menjelaskan penyebabnya.

**Apakah hasilnya dijamin optimal?**
Tidak. Constructive heuristic dan metaheuristik adalah metode pendekatan. Untuk data sangat kecil (misalnya 5 kota) sering kebetulan optimal, tetapi untuk data besar tidak ada jaminan.

**Kenapa simulasi mereset saat saya mengubah data?**
Karena rekaman langkahnya dibuat dari data lama dan sudah tidak sesuai. Jalankan simulasi lagi setelah selesai mengedit.

**Hasil run hilang saat halaman di-refresh?**
Ya. Tabel perbandingan hanya hidup selama halaman terbuka. Salin rute akhir atau catat tabelnya sebelum menutup halaman.

## 10. Batasan

| Hal | Batas |
|-----|-------|
| Jumlah titik untuk simulasi | minimal **4**, maksimal **500** |
| Titik acak | 4 – 200 |
| Tabu Search | maksimal 2.000 iterasi |
| Langkah yang direkam untuk SA | diringkas hingga sekitar 3.000 langkah per run (pendinginan panjang ditampilkan per beberapa level suhu) |
| Format berkas | `.xlsx`, `.csv`, `.txt` (bukan `.xls`) |
| Jenis jarak | Euclidean 2 dimensi pada koordinat `x`, `y` (bukan jarak jalan sebenarnya) |
| Penyimpanan | Tidak ada; data, run, dan hasil hanya ada selama halaman terbuka (hanya pilihan tema yang diingat browser) |

## 11. Glosarium

| Istilah | Arti |
|---------|------|
| **TSP** | *Traveling Salesman Problem*: mencari tour terpendek yang mengunjungi semua titik sekali dan kembali ke awal |
| **Tour / rute** | Urutan kunjungan semua titik |
| **Cost** | Total panjang tour (jarak Euclidean, tertutup) |
| **Heuristik** | Aturan praktis yang cepat menemukan solusi bagus, tanpa jaminan optimal |
| **Metaheuristik** | Strategi umum yang mengarahkan pencarian agar tidak terjebak optimum lokal (mis. Tabu Search, SA) |
| **Constructive heuristic** | Metode yang *membangun* solusi dari nol (NN, NI, FN) |
| **Improvement heuristic** | Metode yang *memperbaiki* solusi yang sudah ada (2-opt, Tabu, SA) |
| **Neighborhood / neighbor** | Himpunan solusi "tetangga" yang bisa dicapai dari solusi sekarang dengan satu move |
| **2-opt** | Move yang menghapus dua edge dan menyambung ulang dengan membalik segmen di antaranya |
| **Δ (delta)** | Selisih cost setelah sebuah move; negatif = lebih baik |
| **Optimum lokal** | Solusi yang tidak bisa diperbaiki oleh satu move pun di neighborhood-nya, belum tentu optimum global |
| **Tabu list / tenure** | Daftar move terlarang / lamanya sebuah move dilarang |
| **Aspirasi** | Pengecualian yang mengizinkan move tabu bila menghasilkan solusi terbaik baru |
| **Suhu (T), cooling rate** | Parameter SA: mengatur seberapa mudah menerima solusi buruk, dan seberapa cepat suhu turun |
| **Seed** | Angka awal generator acak; seed sama menghasilkan urutan acak yang sama |
| **Frame / langkah** | Satu rekaman keadaan algoritma yang bisa diputar ulang di aplikasi |
