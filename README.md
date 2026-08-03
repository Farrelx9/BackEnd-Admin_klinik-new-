# Klinik Senyum — Backend API

REST API untuk aplikasi admin klinik gigi. Dibangun dengan **Express**, **Prisma ORM**, dan database **PostgreSQL** yang di-hosting di **Neon**.

Repo frontend: `klinik-admin` (React + Vite + React Router + Auth Context)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js + Express 5 |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validasi | Zod |

## Struktur Folder

```
src/
  app.js                 # setup express, middleware, mount routes
  server.js               # entrypoint (dotenv + listen)
  lib/prisma.js            # Prisma client singleton
  middleware/
    auth.middleware.js      # requireAuth, requireRole
    error.middleware.js     # error handler terpusat
  controllers/             # logic per resource
  routes/                  # definisi endpoint per resource
  utils/
    asyncHandler.js         # wrapper try/catch untuk async route
    ApiError.js              # custom error class
prisma/
  schema.prisma            # model database
  seed.js                   # data awal (admin + contoh layanan)
```

## Instalasi & Setup Lokal

**Requirement:** Node.js 18+, akun [Neon](https://neon.tech) (gratis).

```bash
# 1. Install dependency
npm install

# 2. Salin file environment
cp .env.example .env
```

### 2. Buat database di Neon

1. Buat project baru di [console.neon.tech](https://console.neon.tech).
2. Buka **Connect** di dashboard project, salin connection string (yang ada `-pooler` di host-nya).
3. Tempel ke `.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

4. Isi juga `JWT_SECRET` dengan string acak yang panjang (bisa generate lewat `openssl rand -base64 32`).

### 3. Jalankan migration

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Ini akan membuat semua tabel (`users`, `patients`, `medical_records`, `appointments`, `services`, `payments`, dll) di database Neon kamu.

> **Catatan:** `prisma migrate dev` aman dijalankan berkali-kali — Prisma hanya menerapkan perubahan yang belum ada, tidak menghapus data existing (kecuali migration itu sendiri memang mengubah struktur secara destruktif, misal drop column).

### 4. Seed data awal (opsional tapi disarankan)

```bash
npm run seed
```

Ini membuat akun admin pertama supaya bisa login:
```
Email:    admin@klinikgigi.com
Password: admin123
```
**Ganti password ini setelah login pertama kali**, atau edit `prisma/seed.js` sebelum menjalankannya.

### 5. Jalankan server

```bash
npm run dev
```

API akan jalan di `http://localhost:4000/api`. Cocokkan dengan `VITE_API_URL` di frontend.

## Endpoint API

Base URL: `/api`

### Auth (publik)
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/register` | Registrasi user baru (idealnya dibatasi setelah ada admin pertama) |
| POST | `/auth/login` | Login → `{ token, user }` |

### Auth (butuh token)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/auth/me` | Data user yang sedang login |
| POST | `/auth/logout` | Logout (client-side discard token) |

### Pasien
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/patients?search=&page=` | List pasien (pagination + pencarian) |
| GET | `/patients/:id` | Detail pasien + riwayat singkat |
| POST | `/patients` | Tambah pasien |
| PUT | `/patients/:id` | Update data pasien |
| DELETE | `/patients/:id` | Hapus pasien |

### Rekam Medis
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/medical-records?patientId=` | List rekam medis (filter per pasien) |
| GET | `/medical-records/:id` | Detail rekam medis |
| POST | `/medical-records` | Tambah rekam medis (bisa sertakan `services[]`) |
| PUT | `/medical-records/:id` | Update rekam medis |
| DELETE | `/medical-records/:id` | Hapus rekam medis |

### Jadwal Kunjungan
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/appointments?date=&status=` | List jadwal (filter tanggal/status) |
| GET | `/appointments/:id` | Detail jadwal |
| POST | `/appointments` | Buat jadwal baru |
| PUT | `/appointments/:id` | Update jadwal |
| DELETE | `/appointments/:id` | Hapus jadwal |

### Layanan & Tindakan
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/services` | List layanan + tarif |
| POST | `/services` | Tambah layanan |
| PUT | `/services/:id` | Update layanan |
| DELETE | `/services/:id` | Hapus layanan |

### Pembayaran
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/payments?status=&patientId=` | List pembayaran |
| POST | `/payments` | Catat pembayaran |
| PUT | `/payments/:id` | Update status pembayaran |
| DELETE | `/payments/:id` | Hapus catatan pembayaran |

### Dokter & Staf (khusus role `ADMIN`)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/staff` | List akun staf/dokter |
| POST | `/staff` | Tambah akun staf/dokter |
| PUT | `/staff/:id` | Update akun (termasuk ganti role) |
| DELETE | `/staff/:id` | Hapus akun |

Semua endpoint kecuali `/auth/register` dan `/auth/login` butuh header:
```
Authorization: Bearer <token>
```

## Role & Hak Akses

Ada 3 role: `ADMIN`, `DOKTER`, `STAF`.
- Endpoint `/staff/*` hanya bisa diakses `ADMIN` (lewat `requireRole("ADMIN")`).
- Endpoint lain saat ini terbuka untuk semua role yang sudah login — sesuaikan `requireRole()` di masing-masing file route kalau butuh pembatasan lebih detail (misal hanya `DOKTER` yang boleh menulis rekam medis).

## Deploy

Backend ini bisa di-deploy ke platform Node.js apa pun (Railway, Render, Fly.io, VPS, dst) selama environment variable berikut diisi:

```
DATABASE_URL
JWT_SECRET
FRONTEND_ORIGIN   # domain frontend production, untuk CORS
NODE_ENV=production
```

Sebelum start di server production, jalankan:
```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` (bukan `migrate dev`) dipakai di production karena tidak interaktif dan tidak membuat migration baru — hanya menerapkan migration yang sudah ada.

## Keamanan

- Password di-hash dengan `bcrypt`, tidak pernah dikembalikan di response manapun.
- Token JWT expire sesuai `JWT_EXPIRES_IN` (default 7 hari).
- `.env` jangan pernah di-commit — sudah ada di `.gitignore`.
- CORS dibatasi ke origin yang didefinisikan di `FRONTEND_ORIGIN`.
