# 🦉 OwlCBT - Modern Computer Based Test Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-7.10-2d3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**Platform Ujian Berbasis Komputer (CBT) Modern, Cepat, dan Open Source untuk Sekolah di Indonesia**  
*Dirancang khusus untuk SD, SMP, SMA, SMK, dan Madrasah di seluruh Nusantara.*

[Tangkapan Layar](#-tangkapan-layar-screenshots) •
[Fitur Unggulan](#-fitur-unggulan) •
[Panduan Instalasi](#-panduan-instalasi-cepat) •
[Akun Default](#-akun-demo-default) •
[Panduan Cetak A4](#-administrasi-ujian-siap-cetak-a4) •
[Deployment Sekolah](#-panduan-deployment-sekolah)

</div>

---

## 📖 Tentang OwlCBT

**OwlCBT** adalah sistem Computer Based Test (CBT) open source generasi baru yang dirancang untuk memenuhi kebutuhan evaluasi akademik sekolah di era modern. Dibangun menggunakan arsitektur mutakhir **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, dan **PostgreSQL**, OwlCBT menghadirkan kecepatan loading instan, keamanan tinggi, ketahanan terhadap beban ratusan siswa simultan, dan antarmuka modern yang ramah pengguna.

OwlCBT dapat digunakan secara **100% GRATIS dan bebas biaya lisensi** oleh seluruh sekolah di Indonesia, baik untuk Penilaian Harian (PH), Penilaian Tengah Semester (PTS/STS), Penilaian Akhir Semester (PAS/SAS), maupun Ujian Sekolah (US).

<div align="center">
  <img src="docs/screenshots/student_dashboard.png" alt="Portal Ujian Siswa OwlCBT" width="850" />
  <p><em>Antarmuka Modern Portal Ujian Siswa OwlCBT</em></p>
</div>

---

## 📸 Tangkapan Layar (Screenshots)

### 1. Halaman Login & Portal Siswa
| Halaman Login Multi-Peran | Portal Ujian Siswa |
| :---: | :---: |
| ![Halaman Login](docs/screenshots/login.png) | ![Portal Siswa](docs/screenshots/student_dashboard.png) |
| *Otentikasi aman siswa, guru, proktor, & admin* | *Daftar ujian aktif & status pengerjaan peserta* |

### 2. Ruang Ujian Live & Konsol Monitoring Proktor
| Ruang Ujian Live & Anti-Cheat | Konsol Monitoring Proktor Realtime |
| :---: | :---: |
| ![Ruang Ujian](docs/screenshots/exam_room.png) | ![Konsol Proktor](docs/screenshots/proctor_console.png) |
| *Timer live, autosave jawaban otomatis, & deteksi pindah tab* | *Pantau progres siswa secara langsung & reset sesi login* |

### 3. Panel Guru (Jadwal Ujian & Bank Soal)
| Pengaturan Jadwal Ujian | Manajemen Bank Soal & Butir Soal |
| :---: | :---: |
| ![Jadwal Ujian](docs/screenshots/teacher_schedule.png) | ![Editor Bank Soal](docs/screenshots/teacher_bank_editor.png) |
| *Durasi waktu, token ujian dinamis, acak soal & acak opsi* | *Dukungan PG tunggal, kompleks (AKM), esai, & import Excel* |

### 4. Master Data Siswa & Administrasi Cetak A4 Standar
| Master Data Siswa & Import Excel | Cetak Kartu Peserta Ujian |
| :---: | :---: |
| ![Master Data Siswa](docs/screenshots/admin_students.png) | ![Kartu Peserta](docs/screenshots/print_cards.png) |
| *Import data siswa via Excel, filter kelas, & WhatsApp wali* | *4 kartu per lembar A4 dengan foto & barcode/QR* |

| Cetak Daftar Hadir Peserta (Zig-Zag) | Cetak Berita Acara Pelaksanaan |
| :---: | :---: |
| ![Daftar Hadir](docs/screenshots/print_attendance.png) | ![Berita Acara](docs/screenshots/print_report.png) |
| *Tanda tangan bergantian rapi standar dinas* | *Kalkulasi otomatis hadir/absen & tanda tangan pejabat* |

---

## ✨ Fitur Unggulan

### 1. 🛡️ 4 Peran Pengguna dengan Hak Akses Ketat (Strict RBAC)
* **Administrator**:
  * Manajemen Master Data Siswa (tambah, edit, hapus, filter kelas/level, import Excel).
  * Manajemen Master Data Guru & Staf (NIP, email, mata pelajaran binaan, import Excel).
  * Cetak Administrasi Ujian Resmi format A4 standar dinas pendidikan.
  * Pengaturan identitas sekolah, logo, dan nama kepala sekolah.
* **Guru / Tenaga Pendidik**:
  * Pembuatan Bank Soal mandiri berbasis mata pelajaran.
  * Dukungan 4 tipe soal: **Pilihan Ganda Tunggal**, **Pilihan Ganda Kompleks (AKM)**, **Benar / Salah**, dan **Esai Uraian**.
  * Import butir soal langsung via Excel (.xlsx).
  * Penjadwalan ujian, penentuan durasi, token ujian, acak soal & acak opsi pilihan.
  * Koreksi dan penilaian jawaban esai siswa dengan rekap nilai otomatis.
* **Proktor / Pengawas Ruangan**:
  * Konsol Monitoring Live: Memantau status pengerjaan siswa secara realtime.
  * Reset login siswa (jika siswa terputus, ganti perangkat, atau browser tertutup).
  * Pantau catatan audit pelanggaran (deteksi siswa keluar layar / ganti tab).
  * Pembuatan dan pergantian token ujian harian.
* **Siswa Peserta Ujian**:
  * Antarmuka bersih, responsif, dan bebas gangguan.
  * Autosave jawaban otomatis setiap kali opsi dipilih.
  * Timer hitung mundur berpresisi tinggi dengan indikator peringatan waktu.
  * Navigasi butir soal cepat dengan indikator: *Terjawab*, *Ragu-Ragu*, dan *Belum Dijawab*.
  * Pilihan ukuran teks (Normal, Besar, Ekstra Besar).
  * Deteksi fokus layar (anti-curang saat berpindah tab atau meminimalkan browser).

---

### 2. 🖨️ Administrasi Ujian Siap Cetak (A4 Standard Kemdikbud & Kemenag)
OwlCBT dilengkapi modul cetak dokumen administrasi ujian siap pakai berformat A4 dengan tata letak rapi, font resmi, dan tombol print browser (`Ctrl + P` / `Cmd + P`):
* **Cetak Kartu Peserta Ujian**: Dilengkapi bingkai kartu resmi, barcode / QR code, foto siswa, sesi, dan ruang.
* **Cetak Daftar Hadir Peserta Ujian**: Dilengkapi isian dinamis Kepala Sekolah, Proktor, Pengawas, serta kolom tanda tangan zig-zag bergantian (titik-titik rapi standar ujian nasional).
* **Cetak Berita Acara Ujian**: Dilengkapi kalkulasi otomatis jumlah peserta terdaftar, hadir, dan tidak hadir, serta format tanda tangan 3 pejabat ruangan.

---

### 3. 📂 Fitur Import Data via Excel (.xlsx)
Tidak perlu input manual satu per satu:
* **Import Data Siswa**: Unduh template Excel dalam 1 klik, isi kolom (NISN, Nama, Kelas, Tingkat, Gender, Password), upload dan data langsung tersimpan.
* **Import Data Guru**: Unduh template Excel, masukkan NIP/Username, Nama, dan Mata Pelajaran binaan.
* **Import Soal Ujian**: Unduh template butir soal, lengkapi soal PG/Esai beserta kunci jawaban.

---

## 🚀 Panduan Instalasi Cepat

### Prasyarat Sistem
* **Node.js**: Versi `18.18.0` atau `20.x` / `22.x` ([Unduh Node.js](https://nodejs.org/))
* **Database PostgreSQL**: Versi `14` atau lebih baru ([Unduh PostgreSQL](https://www.postgresql.org/) atau gunakan layanan gratis seperti Neon / Supabase).
* **Git**: Versi terbaru.

---

### Langkah Demi Langkah Instalasi

#### 1. Clone Repository
```bash
git clone https://github.com/fauzi-dhuhuri/owlcbt-js.git
cd owlcbt-js
```

#### 2. Pasang Dependensi (Dependencies)
```bash
npm install
```

#### 3. Buat Database PostgreSQL
Buka terminal PostgreSQL (atau pgAdmin) dan buat database baru:
```sql
CREATE DATABASE owlcbt_db;
```

#### 4. Konfigurasi Environment (`.env`)
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan koneksi database Anda:
```env
DATABASE_URL="postgresql://postgres:password_kamu@localhost:5432/owlcbt_db?schema=public"
```

#### 5. Sinkronisasi Skema Database
Jalankan sinkronisasi tabel Prisma ke database:
```bash
npm run db:push
```

#### 6. Masukkan Data Awal (Seeding)
Isi database dengan data sekolah, akun admin, guru, proktor, siswa, dan ujian contoh:
```bash
npm run db:seed
```

#### 7. Jalankan Server Development
```bash
npm run dev
```
Akses aplikasi melalui browser di: **`http://localhost:3000`**

---

## 🔑 Akun Demo Default

Setelah menjalankan `npm run db:seed`, Anda dapat langsung login menggunakan akun berikut:

| Peran | Username / NISN | Password | Panel Akses | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | `/admin/students` | Master Data, Import Excel & Cetak Dokumen |
| **Guru** | `guru1` | `guru123` | `/teacher` | Buat Bank Soal, Jadwal & Koreksi Esai |
| **Proktor** | `proktor1` | `proktor123` | `/proctor` | Monitoring Live & Reset Sesi Siswa |
| **Siswa** | `1001` | `siswa123` | `/` | Portal Ujian Peserta (Ahmad Siswa Perdana) |

> 💡 **Catatan Keamanan:** Gunakan username dan password pada tabel di atas untuk masuk ke sistem. Pastikan untuk mengganti password default ini sebelum digunakan dalam ujian sekolah yang sebenarnya.

---

## 🏫 Panduan Deployment Sekolah

### Opsi A: Server Komputer Lokal Sekolah (Offline / Semi-Online via LAN)
Banyak sekolah menyelenggarakan ujian di lab komputer lokal tanpa bergantung pada kuota internet publik:
1. Pasang Node.js & PostgreSQL di komputer server sekolah (PC Server / Laptop Teknisi).
2. Jalankan build produksi:
   ```bash
   npm run build
   ```
3. Pasang process manager **PM2** agar server berjalan otomatis saat komputer menyala:
   ```bash
   npm install -g pm2
   pm2 start npm --name "owlcbt" -- start
   pm2 save
   pm2 startup
   ```
4. Hubungkan komputer proktor dan komputer klien siswa ke switch/router WiFi sekolah yang sama.
5. Siswa dapat mengakses ujian via IP server, contoh: `http://192.168.1.100:3000`.

### Opsi B: VPS Cloud (Ujian Online dari Rumah / HP Siswa)
1. Sewa VPS Ubuntu (minimal RAM 2GB, disarankan 4GB untuk >300 peserta).
2. Gunakan **Nginx** sebagai reverse proxy ke port 3000 dengan sertifikat SSL gratis dari Let's Encrypt (`certbot`).
3. Database PostgreSQL dapat menggunakan database internal VPS atau layanan managed seperti Neon / Supabase.

---

## 📁 Struktur Direktori

```text
owlcbt-js/
├── app/                        # Next.js App Router
│   ├── admin/                  # Panel Administrator & Cetak Dokumen A4
│   │   ├── students/           # Master Data Siswa & Import
│   │   ├── teachers/           # Master Data Guru & Staf
│   │   └── print/              # Modul Cetak (Kartu, Absensi, Berita Acara)
│   ├── api/                    # API Endpoints (Auth, Exams, Import, Proctor)
│   ├── exam/                   # Ruang Ujian & Konfirmasi Siswa
│   │   └── [examId]/
│   │       ├── confirm/        # Konfirmasi Peserta & Token
│   │       ├── room/           # Ruang Pengerjaan Ujian & Anti-Cheat
│   │       └── result/         # Halaman Hasil & Nilai
│   ├── login/                  # Halaman Login Multi-Role
│   ├── proctor/                # Konsol Pengawasan Proktor Realtime
│   ├── teacher/                # Panel Guru: Bank Soal, Jadwal, Penilaian
│   └── page.tsx                # Beranda Portal Siswa (Guarded)
├── components/                 # Komponen UI Bersama (Sidebar, Layout, Modals)
├── lib/                        # Helper Autentikasi, Database Prisma, & Utils
├── prisma/
│   ├── schema.prisma           # Skema Lengkap Model Database
│   └── seed.ts                 # Script Seeding Data Awal
└── scripts/                    # Skrip Migrasi & Utilitas
```

---

## 🤝 Kontribusi & Lisensi

Kontribusi dari para pengembang, guru TIK, teknisi sekolah, dan komunitas pendidikan sangat kami nantikan! Silakan buat *Issue* untuk saran fitur / laporan bug, atau kirimkan *Pull Request*.

Proyek ini dirilis di bawah lisensi terbuka **[MIT License](LICENSE)**. Bebas digunakan, dimodifikasi, dan disebarluaskan untuk kepentingan pendidikan di seluruh nusantara.

---

<div align="center">
  Dibuat dengan ❤️ untuk kemajuan pendidikan Indonesia oleh <strong>Muhammad Fauzi Dhuhuri</strong> & Komunitas OwlCBT.
</div>
