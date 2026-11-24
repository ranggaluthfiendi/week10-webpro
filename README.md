# Data Mahasiswa — Week 10 Webpro

Aplikasi web sederhana untuk mengelola data mahasiswa. Backend menggunakan NestJS, PostgreSQL 16, dan Prisma ORM 6. Data disimpan di database, sehingga tetap ada setelah server direstart.

## Fitur

- Tambah, lihat daftar/detail, ubah, dan hapus mahasiswa.
- Filter mahasiswa berdasarkan jurusan (tidak membedakan huruf besar/kecil).
- Hitung total mahasiswa melalui endpoint `/students/count`.
- Validasi input, NIM unik, dan respons ketika data tidak ditemukan.
- Tampilan desktop dan mobile dengan HTML, CSS, dan JavaScript sederhana.

## Persiapan

- Node.js (pengujian lokal memakai v24.13.0) dan npm.
- PostgreSQL 16 yang sedang berjalan, serta pgAdmin atau psql.
- Buat database kosong bernama `mahasiswa_week10`.

```sql
CREATE DATABASE mahasiswa_week10;
```

## Cara menjalankan

```bash
git clone https://github.com/ranggaluthfiendi/week10-webpro.git
cd week10-webpro
npm ci
```

Salin `.env.example` menjadi `.env`. Di PowerShell:

```powershell
Copy-Item .env.example .env
```

Isi koneksi database sesuai username, password, dan port PostgreSQL sendiri:

```env
DATABASE_URL="postgresql://postgres:PASSWORD_KAMU@localhost:5432/mahasiswa_week10?schema=public"
PORT=3001
```

Jika password berisi karakter khusus, lakukan URL encoding pada bagian password. File `.env` tidak ikut Git.

```bash
npx prisma migrate dev
npx prisma generate
npm run build
npm start
```

Buka **http://localhost:3001** untuk aplikasi web atau **http://localhost:3001/students** untuk API. Jalankan perintah npm dari root proyek agar file `public/index.html` terbaca. Untuk pengembangan gunakan `npm run start:dev`. Server ini ditujukan untuk penggunaan lokal.

Database awal kosong. Tambahkan mahasiswa dari form aplikasi atau endpoint POST. Tidak ada seed otomatis yang memasukkan ulang data setelah dihapus.

## Model database

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id | Int | Primary key, bertambah otomatis |
| nim | String | Unik, maksimal 30 karakter pada API |
| nama | String | Wajib, maksimal 100 karakter pada API |
| jurusan | String | Wajib, maksimal 100 karakter pada API |

Model `Student` pada `prisma/schema.prisma` dipetakan ke tabel PostgreSQL `students`. Riwayat migrasi awal ada di `prisma/migrations/20261124102920_init/migration.sql`.

## Daftar endpoint

| Method | Endpoint | Fungsi | Status berhasil |
| --- | --- | --- | --- |
| GET | `/students` | Daftar mahasiswa | 200 |
| GET | `/students?jurusan=Informatika` | Filter jurusan | 200 |
| GET | `/students/count` | Total mahasiswa | 200 |
| GET | `/students/:id` | Detail mahasiswa | 200 |
| POST | `/students` | Tambah mahasiswa | 201 |
| PATCH | `/students/:id` | Ubah sebagian data | 200 |
| DELETE | `/students/:id` | Hapus mahasiswa | 200 |

Body POST, pilih **Body → raw → JSON** pada Postman:

```json
{
  "nim": "123450001",
  "nama": "Andi Pratama",
  "jurusan": "Informatika"
}
```

Body PATCH:

```json
{
  "nama": "Andi Pratama Diperbarui"
}
```

Gunakan ID dari respons POST pada URL detail, PATCH, dan DELETE. Input tidak valid mengembalikan 400, NIM duplikat 409, dan ID mahasiswa yang tidak ditemukan 404. Contoh permintaan siap pakai tersedia di [students.http](students.http) untuk ekstensi REST Client VS Code; file ini juga dapat dijadikan acuan Postman.

## Integrasi Prisma

Alur aplikasi: browser/controller → `StudentsService` → `PrismaService` → PostgreSQL.

- `PrismaService` memperluas `PrismaClient` dan membuka koneksi pada inisialisasi modul.
- `PrismaModule` mengekspor provider tersebut untuk `StudentsModule`.
- `StudentsService` menggunakan `findMany`, `findUnique`, `create`, `update`, `delete`, dan `count`.
- Konfigurasi TypeORM/SQLite dan entity lama sudah diganti dengan model Prisma.
- Method GET lama dipertahankan. Controller dilengkapi POST, PATCH, DELETE, dan detail karena versi minggu 9 hanya memiliki GET daftar.

## Pengujian

```bash
npm run build
npx prisma validate
npx prisma migrate status
npm run test:e2e
```

Pengujian E2E memakai Microsoft Edge yang terpasang, PostgreSQL dari `.env`, dan port **3101** yang harus kosong. Jika Edge tidak tersedia, instal Edge terlebih dahulu. Skrip menjalankan dan menghentikan proses server sendiri, membuat data uji dengan NIM unik, dan menghapus data buatannya setelah selesai. Untuk pengujian terisolasi, gunakan database khusus pada `.env` lalu jalankan migrasi terlebih dahulu.

Skrip menguji CRUD API dan browser, filter/count, input salah, NIM duplikat, ID tidak ditemukan, dan persistensi setelah proses server dihentikan lalu dijalankan kembali. Respons aktual tersimpan di [docs/test-results.json](docs/test-results.json). Screenshot desktop/mobile diambil ketika data uji masih ada; data uji kemudian dihapus sehingga database lokal boleh kosong setelah pengujian.

Untuk uji persistensi manual: tambah mahasiswa, hentikan server dengan Ctrl+C, jalankan kembali, lalu cek GET atau refresh browser. Data yang belum dihapus harus tetap ada.

## Screenshot

### Tampilan desktop

![Desktop](docs/screenshots/01-desktop.png)

### Tampilan mobile

![Mobile](docs/screenshots/02-mobile.png)

### CRUD, validasi, dan persistensi

![Hasil respons aktual pengujian](docs/screenshots/03-hasil-uji-api.png)

Gambar hasil uji berisi respons HTTP aktual yang direkam skrip otomatis, bukan screenshot Postman. Bukti konfigurasi, migrasi, dan tabel tersedia di [docs/screenshots/04-database-prisma.png](docs/screenshots/04-database-prisma.png). Screenshot tersebut menyajikan hasil pemeriksaan CLI dan query langsung, bukan tampilan pgAdmin.

## Struktur file

```text
prisma/schema.prisma                  Model Student
prisma/migrations/                    SQL dan riwayat migrasi
prisma.config.ts                      Konfigurasi CLI Prisma
src/main.ts                           Server dan validasi global
src/app.module.ts                     Modul utama
src/app.controller.ts                 Menyajikan halaman web
src/prisma/prisma.module.ts            Modul provider Prisma
src/prisma/prisma.service.ts           Koneksi Prisma Client
src/students/students.module.ts        Modul mahasiswa
src/students/students.controller.ts    Endpoint REST
src/students/students.service.ts       Query dan penanganan error database
src/students/dto/create-student.dto.ts Validasi tambah data
src/students/dto/update-student.dto.ts Validasi ubah data
public/index.html                     Tampilan dan interaksi CRUD
scripts/verify.cjs                     Pengujian API, restart, dan browser
scripts/database-evidence.cjs          Bukti schema/migrasi/tabel
students.http                         Contoh request pengujian manual
.env.example                          Template koneksi tanpa password asli
```

## Catatan dependensi

Saat instalasi, npm audit melaporkan 4 temuan high pada rantai dependensi CLI Prisma 6 (`@prisma/config`, `deepmerge-ts`, `effect`, dan `prisma`). Perbaikan otomatis yang ditawarkan memerlukan upgrade mayor Prisma; upgrade tersebut belum diterapkan agar konfigurasi tutorial Prisma 6 tetap konsisten. Aplikasi ini merupakan latihan lokal, belum disiapkan untuk deployment produksi.

## Pengumpulan

Repository: https://github.com/ranggaluthfiendi/week10-webpro

Kode, riwayat migrasi, README, dan screenshot disertakan dalam repository. Setelah memastikan repository dapat dibuka oleh dosen, kumpulkan link repository tersebut melalui LMS.
