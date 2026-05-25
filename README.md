# SnapHire

SnapHire adalah sistem Human Resource Automation berbasis AI yang membantu proses screening CV, manajemen rekrutmen, AI Match Scoring, ATS automation, dan email recruitment workflow secara otomatis.

---

## About Project

SnapHire adalah platform rekrutmen modern yang dirancang untuk membantu tim HR mengelola proses hiring secara lebih cepat, terstruktur, dan objektif. Sistem ini memadukan workflow ATS, analisis CV berbasis AI, manajemen kandidat, serta otomatisasi email agar proses seleksi dapat berjalan end-to-end dalam satu ekosistem yang terpusat.

Masalah utama yang ingin diselesaikan adalah proses screening kandidat yang masih manual, tidak konsisten, dan rentan terhadap bias. SnapHire dibuat untuk mengurangi beban operasional HR, meningkatkan akurasi seleksi awal, serta mempercepat pengambilan keputusan rekrutmen melalui pemanfaatan AI dan automasi sistem.

Fokus utama sistem ini adalah membangun ATS berbasis AI yang mampu membaca dokumen CV, mengekstraksi data relevan, menghitung kecocokan kandidat terhadap lowongan, dan mengotomatiskan tindak lanjut rekrutmen. Dengan pendekatan ini, tim HR dapat berfokus pada evaluasi strategis, bukan pekerjaan administratif berulang.

Tujuan akhirnya adalah meningkatkan efisiensi HR recruitment, mempercepat time-to-hire, dan menghadirkan proses seleksi kandidat yang lebih objektif, terdokumentasi, dan mudah dipantau.

---

## Background

Proses rekrutmen tradisional menghadapi sejumlah kendala yang berdampak langsung pada kecepatan dan kualitas hiring. SnapHire dikembangkan sebagai respons terhadap tantangan berikut:

- Screening CV manual memakan waktu dan sulit diskalakan ketika jumlah pelamar meningkat.
- Human error dan subjektivitas recruiter dapat memengaruhi konsistensi penilaian kandidat.
- Sulitnya tracking kandidat membuat status proses rekrutmen tidak transparan dan kurang terorganisasi.
- Data recruitment yang tidak terpusat menyebabkan informasi kandidat, lowongan, dan histori proses tersebar di banyak tempat.
- Time-to-hire yang lama menurunkan efisiensi operasional dan dapat membuat kandidat potensial berpindah ke perusahaan lain.

---

## Project Goals

Tujuan utama SnapHire adalah membangun sistem rekrutmen yang lebih cepat, cerdas, dan terukur. Sasaran utamanya meliputi:

- Automasi screening CV agar proses seleksi awal menjadi lebih efisien.
- Objektivitas penilaian kandidat melalui AI Match Score dan structured evaluation.
- Centralized recruitment management untuk mengelola lowongan, kandidat, dan status seleksi dalam satu sistem.
- AI-powered recruitment workflow yang mendukung parsing CV, scoring, dan notifikasi otomatis.
- Mempercepat hiring process tanpa mengorbankan kualitas evaluasi kandidat.

---

## Main Features

### HR Features

- HR Dashboard: menampilkan ringkasan aktivitas rekrutmen, kandidat aktif, dan status pipeline.
- Recruitment pipeline visualization: memudahkan HR memantau tahapan seleksi kandidat dari awal hingga final decision.
- Manage job vacancy: membuat, memperbarui, dan mengelola lowongan pekerjaan secara terpusat.
- Candidate management: melihat daftar pelamar, detail profil, CV, dan riwayat status kandidat.
- AI Match Score: menampilkan skor kecocokan kandidat terhadap kebutuhan lowongan.
- CV Scanner: membaca dan memproses dokumen CV untuk ekstraksi informasi penting.
- AI Resume Parsing: mengubah isi CV menjadi data terstruktur yang siap diproses sistem.
- Interview scheduling: membantu pengaturan jadwal interview atau technical test.
- Candidate status tracking: melacak perubahan status kandidat selama proses rekrutmen.
- Email notification automation: mengirim notifikasi otomatis terkait status lamaran, interview, dan hasil seleksi.
- HR account settings: mengelola pengaturan akun HR dan preferensi pengguna.

### Admin Features

- Admin dashboard: menampilkan gambaran umum aktivitas sistem dan status operasional rekrutmen.
- HR registration management: mengelola registrasi akun HR yang masuk ke sistem.
- Account activation: mengaktifkan atau menonaktifkan akun sesuai kebutuhan operasional.
- Auto password generator: menghasilkan password awal yang aman untuk akun baru.
- Activity logs: mencatat aktivitas penting untuk audit dan monitoring.
- Recruitment analytics: menyajikan data analitik terkait performa rekrutmen dan penggunaan sistem.
- Announcement publisher: menerbitkan pengumuman internal kepada pengguna sistem.

---

## AI Implementation

SnapHire menggunakan Gemini AI sebagai inti pemrosesan cerdas untuk membaca CV, memahami konten dokumen, dan menghasilkan output yang terstruktur. Implementasi AI dirancang untuk mendukung proses rekrutmen yang konsisten, dapat diaudit, dan minim interpretasi subjektif.

- Penggunaan Gemini AI: digunakan untuk pemahaman teks, parsing CV, dan pengambilan data kandidat yang relevan.
- CV parsing: mengekstrak informasi seperti identitas kandidat, pengalaman kerja, pendidikan, sertifikasi, dan skill.
- Skill extraction: mengidentifikasi kemampuan teknis dan non-teknis dari CV secara otomatis.
- Match score calculation: menghitung skor kecocokan kandidat berdasarkan kesesuaian skill, pengalaman, dan requirement lowongan.
- Prompt engineering: menggunakan prompt yang terstruktur untuk membatasi output AI agar konsisten dan relevan.
- Structured JSON output: memastikan hasil AI dapat langsung digunakan oleh backend dan frontend tanpa proses parsing tambahan yang kompleks.
- Deterministic AI configuration: menjaga konfigurasi AI tetap stabil dengan parameter yang meminimalkan variasi output yang tidak perlu.
- Exponential Backoff retry mechanism: meningkatkan reliabilitas proses AI ketika terjadi kegagalan sementara pada request.

Untuk membuat AI lebih objektif dalam menilai kandidat, SnapHire memaksa proses evaluasi berbasis struktur data dan kriteria yang jelas. AI tidak hanya membaca teks bebas, tetapi menilai berdasarkan requirement lowongan, bobot kompetensi, dan format output yang konsisten. Dengan cara ini, hasil scoring lebih terukur, dapat dibandingkan antar kandidat, dan mengurangi pengaruh bias subjektif pada tahap screening awal.

---

## Software Architecture

Arsitektur SnapHire dibangun dengan pemisahan tanggung jawab yang jelas antara frontend, backend, core services, dan external services.

### Frontend

- Next.js: framework utama untuk aplikasi web modern berbasis React.
- React: membangun antarmuka pengguna yang interaktif dan modular.
- TypeScript: menjaga konsistensi tipe data dan meningkatkan maintainability.
- Tailwind CSS: mempercepat pengembangan UI dengan utility-first styling.

### Backend

- Express.js: menyediakan REST API untuk proses bisnis utama.
- Authentication middleware: mengamankan endpoint berdasarkan status autentikasi pengguna.
- Role middleware: membatasi akses fitur berdasarkan peran seperti admin, HR, atau kandidat.
- Validation & error handling: memastikan request tervalidasi dan error ditangani secara konsisten.

### Core Services

- CV Upload Service: menangani upload, validasi, dan penyimpanan file CV.
- AI Processing Service: memproses parsing, ekstraksi skill, dan scoring kandidat.
- ATS Automation Service: mengelola workflow rekrutmen dan status kandidat.
- Notification Service: menangani notifikasi sistem, termasuk email dan status update.
- Email Polling / IMAP Service: membaca inbox rekrutmen dan memproses email masuk secara otomatis.

### External Services

- Gemini AI: digunakan untuk pemrosesan bahasa alami dan analisis CV.
- Supabase PostgreSQL: menyimpan data aplikasi, kandidat, lowongan, dan log aktivitas.
- Azure Blob Storage: menyimpan file CV dan dokumen pendukung secara terpusat.
- Gmail SMTP / IMAP: mendukung pengiriman dan pembacaan email rekrutmen.
- Google OAuth: menyediakan autentikasi berbasis akun Google.

---

## Cloud Infrastructure

| Service | Function |
| --- | --- |
| Azure Virtual Machine | Menjalankan backend service, worker, dan komponen server-side yang membutuhkan environment khusus. |
| Azure Blob Storage | Menyimpan file CV, attachment email, dan dokumen rekrutmen secara aman dan terpusat. |
| Supabase | Menyediakan database PostgreSQL, autentikasi, dan integrasi data backend aplikasi. |
| Cloudflare | Mendukung proteksi jaringan, CDN, caching, dan layer keamanan tambahan untuk aplikasi. |
| Hostinger | Digunakan untuk hosting domain, website publik, atau konfigurasi deployment pendukung. |

---

## End-to-End Workflow

### Workflow Rekrutmen Utama

1. HR membuat lowongan.
2. Lowongan dipublish.
3. Kandidat upload CV.
4. AI parsing CV.
5. AI match scoring.
6. Kandidat masuk database.
7. HR review kandidat.
8. Interview / technical test.
9. Final hiring decision.
10. Automatic email notification.

### Workflow Email Polling

- Kandidat kirim CV via email.
- Sistem membaca inbox via IMAP.
- Sistem mengambil attachment CV.
- AI processing otomatis.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Express.js
- Node.js
- TypeScript
- Middleware-based API architecture

### AI

- Gemini AI
- Prompt engineering
- Structured JSON response
- Exponential backoff retry

### Database

- Supabase PostgreSQL

### Cloud

- Azure Virtual Machine
- Azure Blob Storage
- Cloudflare
- Hostinger

### Authentication

- Supabase Auth
- Google OAuth
- Role-based access control

### DevOps

- GitHub
- Environment-based deployment
- Cloud-hosted service separation

---

## Deployment

- Production URL: https://snaphire.site
- GitHub Repository: https://github.com/Yang-Penting-A/SnapHire

---

## Team Members

| Name | NIM | Role |
| ---- | --- | ---- |
| Olivia Nefri | 23/514860/TK/56532 | Project Manager, Software Engineer, AI Engineer |
| Amira Syafika Pohan | 23/514788/TK/56518 | Software Engineer, Cloud Engineer |
| Aurellya Ratna Dewanti | 23/517176/TK/56870 | UI/UX Designer, Software Engineer |

---

## Installation Guide

### 1. Clone repository

```bash
git clone https://github.com/Yang-Penting-A/SnapHire.git
cd SnapHire
```

### 2. Install dependencies

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 3. Setup environment variables

Sesuaikan konfigurasi environment menggunakan file contoh `.env.example` yang tersedia di masing-masing folder frontend dan backend.

### 4. Run frontend

```bash
cd frontend
npm run dev
```

### 5. Run backend

```bash
cd backend
npm run dev
```

## Project Structure

```bash
SnapHire/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── core/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── docs/
├── README.md
└── .github/
```

---

## Authentication & Security

SnapHire menerapkan beberapa lapisan keamanan untuk menjaga akses dan data pengguna tetap terlindungi:

- Supabase Auth: menangani autentikasi pengguna secara terpusat.
- Google OAuth: memudahkan login dengan akun Google yang aman.
- Role-based access control: membatasi fitur berdasarkan peran pengguna.
- Middleware authentication: memvalidasi setiap request yang membutuhkan otorisasi.
- Secure file upload: membatasi jenis file, ukuran file, dan alur penyimpanan dokumen CV.
- Session handling: menjaga sesi login tetap aman dan konsisten di seluruh aplikasi.

---

## Email Automation System

SnapHire memiliki sistem otomatisasi email untuk mendukung proses rekrutmen yang cepat dan responsif:

- SMTP notification: mengirim email notifikasi terkait status lamaran, interview, dan hasil seleksi.
- IMAP email polling: membaca email masuk dari inbox rekrutmen secara berkala.
- Automatic CV extraction: mengambil attachment CV dari email dan memprosesnya secara otomatis.
- Recruitment notification system: memastikan kandidat dan tim HR menerima pembaruan status secara tepat waktu.



