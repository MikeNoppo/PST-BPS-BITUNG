# Rate Limiting & Anti-Spam (Pengaduan API)

Dokumen ini menjelaskan bagaimana mekanisme rate limiting & anti-spam yang saat ini diterapkan pada endpoint `POST /api/pengaduan` bekerja, cara mengujinya, cara menyesuaikan batas, serta rekomendasi peningkatan untuk produksi.

---

## Ringkas

Lapisan proteksi **in-memory** (tidak persisten) untuk membatasi jumlah pengiriman pengaduan dan mencegah spam / duplikasi konten dalam waktu singkat.

| Dimensi | Window | Batas | Kode Error |
|---------|--------|-------|------------|
| IP (short) | 10 menit | 5 kiriman | `RATE_LIMIT_IP_SHORT` |
| IP (daily) | 24 jam (rolling) | 20 kiriman | `RATE_LIMIT_IP_DAILY` |
| Email | 1 jam | 3 kiriman | `RATE_LIMIT_EMAIL` |
| Duplikat Konten | 30 menit | 1 (identik) | `DUPLICATE_CONTENT` |
| Honeypot | — | — | `INVALID_REQUEST` |

Semua kegagalan batas mengembalikan HTTP `429` (kecuali honeypot: `400`).

---

## Struktur Kode

Lokasi implementasi: `app/api/pengaduan/route.ts`

Bagian utama yang ditambahkan:

```ts
interface SubmissionMeta { t: number; email: string; hash: string }
interface RateStore {
  perIp: Record<string, number[]>
  perEmail: Record<string, number[]>
  recent: SubmissionMeta[]
  lastCleanup: number
}
// Konstanta window & limit (ms + angka)
// Fungsi cleanup() membersihkan entri kadaluarsa
// Fungsi checkAndRecordLimits(ip, email, description) -> { ok, code?, message? }
```
`RateStore` disimpan pada `globalThis.__complaintRateStore` agar survive hot-reload di dev.

### Alur POST

1. Validasi Zod & honeypot (`hp_field`).
2. Ekstrak IP dari header `x-forwarded-for` (fallback: `unknown`).
3. Panggil `checkAndRecordLimits(...)`:
  - Prune / cleanup jika > 60 detik sejak cleanup terakhir.
  - Hitung jumlah kiriman IP pada window 10 menit & 24 jam.
  - Hitung jumlah kiriman email pada window 1 jam.
  - Normalisasi deskripsi (trim, lower, collapse whitespace) → hashing sederhana (fungsi polynomial) → cek duplikat.
4. Bila melewati batas → response 429 JSON `{ error, message }`.
5. Bila lolos → generate kode pengaduan & simpan ke database.
6. Kirim respons sukses `{ data: { id, code, createdAt } }`.

### Cleanup

- Dipicu lazily setiap permintaan baru (maks sekali per menit).
- Menghapus timestamp / meta yang sudah keluar dari window masing-masing.

### Hash Konten

- Fungsi polynomial sederhana untuk performa cepat.
- Hash disimpan di `recent` (bersama timestamp & email) untuk window 30 menit.

---

## Respon Error

Contoh payload (HTTP 429):

```json
{ "error": "RATE_LIMIT_IP_SHORT", "message": "Terlalu banyak percobaan dari IP Anda dalam 10 menit. Coba lagi nanti." }
```

Kemungkinan nilai `error`:

- `RATE_LIMIT_IP_SHORT`
- `RATE_LIMIT_IP_DAILY`
- `RATE_LIMIT_EMAIL`
- `DUPLICATE_CONTENT`

Honeypot: `{"error":"INVALID_REQUEST"}` (HTTP 400).

Validasi zod gagal: `{"error":"VALIDATION_ERROR", "details": ...}` (HTTP 400).

---

## Cara Uji Manual (Dev)

Gunakan browser console / curl / REST client.

1. Kirim 5 kali cepat → ke-6 dalam <10 menit → 429 `RATE_LIMIT_IP_SHORT`.
2. Total 20 kiriman (boleh beda email) dalam 24 jam → kiriman ke-21 → 429 `RATE_LIMIT_IP_DAILY`.
3. Gunakan 1 email kirim 3 kali <1 jam → kiriman ke-4 → 429 `RATE_LIMIT_EMAIL`.
4. Kirim deskripsi identik dua kali <30 menit → 429 `DUPLICATE_CONTENT`.
5. Isi field tersembunyi `hp_field` → 400 `INVALID_REQUEST`.

Untuk reset cepat (hanya dev): restart server / hapus properti global di REPL:

```js
delete globalThis.__complaintRateStore
```

---

## Penyesuaian Batas

Ubah konstanta di atas blok rate limit:
```ts
const RL_WINDOW_SHORT_MS = 10 * 60 * 1000
const RL_LIMIT_PER_IP_SHORT = 5
// dst.
```
Sesuaikan secara proporsional. Setelah ubah & deploy build baru, counter reset (in-memory).

### Rekomendasi Produksi

| Area | Rekomendasi |
|------|-------------|
| Distribusi multi-instance | Gunakan Redis / Upstash; ganti struktur in-memory dengan operasi INCR + TTL. |
| Observabilitas | Log rate limit hits (structured). |
| False positive NAT | Pertimbangkan menaikkan limit IP atau kombinasi IP + fingerprint ringan. |
| Duplikat konten | Simpan fingerprint (MinHash / simhash) untuk near-duplicate, atau minimal per email/IP saja. |
| Abuse escalation | Tambahkan backoff (mis. tambahkan header `Retry-After`). |
| Captcha | Integrasi invisible captcha setelah pelanggaran berulang. |

---
## Keterbatasan Implementasi Sekarang

1. **Tidak persisten**: Restart server menghapus semua state.
2. **Tidak cluster-aware**: Jika ada beberapa instance, masing-masing punya counter sendiri → limit bisa terlewati secara agregat.
3. **Hash sederhana**: Bukan kriptografis; hanya untuk identifikasi cepat string identik.
4. **Edge bug (global duplicate)**: Kondisi saat ini di kode:

  ```ts
  const duplicate = rateStore.recent.find(r => r.hash === h && (r.email === email || ip === ip))
  // ip === ip selalu true → efeknya: duplikat identik global (siapa pun) dalam 30 menit akan ditolak.
  ```

  Jika maksudnya membatasi hanya per (email OR IP) ubah menjadi:

  ```ts
  // Simpan juga ip di SubmissionMeta, lalu:
  const duplicate = rateStore.recent.find(r => r.hash === h && (r.email === email || r.ip === ip))
  ```

5. **Tidak ada header standar**: Belum mengirim `Retry-After`; bisa ditambahkan untuk UX lebih baik.

---
## Contoh Migrasi ke Redis (Konsep Singkat)

(Pseudocode)

```ts
// key patterns
iKeyShort = `rl:ip:short:${ip}` // EX 600
// INCR iKeyShort; if return > LIMIT → block
// Gunakan pipeline untuk multi key (short + daily + email)
```
Tambahkan wrapper util agar fallback ke in-memory ketika Redis tidak tersedia.

---
## Tambahan: Penanganan di Frontend
Pada `app/pengaduan/page.tsx` sudah ada mapping kode → pesan user-friendly untuk menampilkan alasan rate limit di UI.

---
## FAQ Singkat
- Q: Mengapa pakai in-memory?  
  A: Cepat & sederhana untuk fase awal; mudah dihapus jika overload.
- Q: Bagaimana reset manual?  
  A: Deploy ulang atau hapus properti global.
- Q: Apakah perlu Hash kuat?  
  A: Tidak; ini bukan untuk keamanan, hanya deduplikasi cepat.

---
## Roadmap Opsional
1. Tambah header `Retry-After` sesuai estimasi window tersisa.
2. Endpoint admin untuk melihat statistik hit rate limit.
3. Redis + adaptif dynamic limits (berdasarkan traffic).
4. Simpan metrik di Prometheus / OpenTelemetry events.
5. Tambah penundaan incremental (progressive delay) setelah beberapa pelanggaran.

---
Terakhir diperbarui: (sesuaikan tanggal commit saat diterapkan)
