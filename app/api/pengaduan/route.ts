import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, isFonnteSuccess } from '@/lib/fonnte'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'

// ------------------ Rate Limiting & Anti-Spam ------------------
// In-memory store (will reset on redeploy / server restart). Cukup sebagai lapisan proteksi dasar.
// Jika ingin persisten/distribusi multi-instance, gunakan Redis / Upstash.

interface SubmissionMeta {
  t: number // timestamp ms
  email: string
  ip: string
  hash: string // hash ringkas deskripsi
}

interface RateStore {
  perIp: Record<string, number[]> // daftar timestamp untuk IP
  perEmail: Record<string, number[]>
  recent: SubmissionMeta[] // sliding window untuk deduplikasi konten
  lastCleanup: number
}

const RL_WINDOW_SHORT_MS = 10 * 60 * 1000 // 10 menit
const RL_LIMIT_PER_IP_SHORT = 5
const RL_WINDOW_LONG_MS = 24 * 60 * 60 * 1000 // 24 jam
const RL_LIMIT_PER_IP_LONG = 20
const RL_WINDOW_EMAIL_MS = 60 * 60 * 1000 // 1 jam
const RL_LIMIT_PER_EMAIL = 3
const DUP_WINDOW_MS = 30 * 60 * 1000 // 30 menit untuk deteksi duplikat konten

// Attach ke globalThis agar bertahan antar hot-reload (development) / reuse (server runtime)
const g = globalThis as any
if (!g.__complaintRateStore) {
  g.__complaintRateStore = { perIp: {}, perEmail: {}, recent: [], lastCleanup: Date.now() } as RateStore
}
const rateStore: RateStore = g.__complaintRateStore

function hashContent(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

function cleanup(now: number) {
  if (now - rateStore.lastCleanup < 60 * 1000) return // max 1x per menit
  const cutoffLongest = now - RL_WINDOW_LONG_MS
  for (const key of Object.keys(rateStore.perIp)) {
    rateStore.perIp[key] = rateStore.perIp[key].filter(ts => ts >= cutoffLongest)
    if (!rateStore.perIp[key].length) delete rateStore.perIp[key]
  }
  const cutoffEmail = now - RL_WINDOW_EMAIL_MS
  for (const key of Object.keys(rateStore.perEmail)) {
    rateStore.perEmail[key] = rateStore.perEmail[key].filter(ts => ts >= cutoffEmail)
    if (!rateStore.perEmail[key].length) delete rateStore.perEmail[key]
  }
  const cutoffDup = now - DUP_WINDOW_MS
  rateStore.recent = rateStore.recent.filter(r => r.t >= cutoffDup)
  rateStore.lastCleanup = now
}

function checkAndRecordLimits(ip: string, email: string, description: string): { ok: boolean; code?: string; message?: string } {
  const now = Date.now()
  cleanup(now)

  const ipArr = rateStore.perIp[ip] || (rateStore.perIp[ip] = [])
  const emailArr = rateStore.perEmail[email] || (rateStore.perEmail[email] = [])

  // Filter window-specific arrays (lazy prune)
  const shortCut = now - RL_WINDOW_SHORT_MS
  const longCut = now - RL_WINDOW_LONG_MS
  const emailCut = now - RL_WINDOW_EMAIL_MS
  let shortCount = 0
  let longCount = 0
  rateStore.perIp[ip] = ipArr.filter(ts => {
    if (ts >= shortCut) shortCount++
    if (ts >= longCut) longCount++
    return ts >= longCut
  })
  let emailCount = 0
  rateStore.perEmail[email] = emailArr.filter(ts => { if (ts >= emailCut) emailCount++; return ts >= emailCut })

  if (shortCount >= RL_LIMIT_PER_IP_SHORT) {
    return { ok: false, code: 'RATE_LIMIT_IP_SHORT', message: 'Terlalu banyak percobaan dari IP Anda dalam 10 menit. Coba lagi nanti.' }
  }
  if (longCount >= RL_LIMIT_PER_IP_LONG) {
    return { ok: false, code: 'RATE_LIMIT_IP_DAILY', message: 'Batas harian pengiriman dari IP ini tercapai.' }
  }
  if (emailCount >= RL_LIMIT_PER_EMAIL) {
    return { ok: false, code: 'RATE_LIMIT_EMAIL', message: 'Batas pengiriman untuk email ini tercapai untuk 1 jam terakhir.' }
  }

  // Duplicate content check (same email OR same IP + hash deskripsi)
  const normalized = description.trim().toLowerCase().replace(/\s+/g, ' ')
  const h = hashContent(normalized)
  const duplicate = rateStore.recent.find(r => r.hash === h && (r.email === email || r.ip === ip))
  if (duplicate) {
    return { ok: false, code: 'DUPLICATE_CONTENT', message: 'Konten pengaduan identik telah dikirim baru-baru ini.' }
  }

  // Record
  rateStore.perIp[ip].push(now)
  rateStore.perEmail[email].push(now)
  rateStore.recent.push({ t: now, email, ip, hash: h })
  return { ok: true }
}
// ---------------------------------------------------------------

// Zod schema mirroring client side
const complaintSchema = z.object({
  namaLengkap: z.string().min(3).max(150),
  email: z.string().email().max(190).transform(v => v.toLowerCase()),
  nomorTelepon: z.string().regex(/^(\+62|08)\d{7,13}$/), // +62 / 08 kemudian 7-13 digit lagi
  klasifikasi: z.enum([
    'PERSYARATAN_LAYANAN',
    'PROSEDUR_LAYANAN',
    'WAKTU_PELAYANAN',
    'BIAYA_TARIF_PELAYANAN',
    'PRODUK_PELAYANAN',
    'KOMPETENSI_PELAKSANA_PELAYANAN',
    'PERILAKU_PETUGAS_PELAYANAN',
    'SARANA_DAN_PRASARANA'
  ] as const),
  deskripsi: z.string().max(1500), // no min per user request
  // honeypot
  hp_field: z.string().optional().default('')
})

function generateComplaintCode(): string {
  // Format: PGD + yymmdd + random 3 chars
  const now = new Date()
  const datePart = now.toISOString().slice(2,10).replace(/-/g,'') // YYMMDD with some slicing
  const yymmdd = datePart.slice(0,2) + datePart.slice(3,5) + datePart.slice(6,8)
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3)
  return `PGD${yymmdd}${rand}`
}

async function createUniqueCode(attempt = 0): Promise<string> {
  if (attempt > 5) throw new Error('Gagal membuat kode unik')
  const code = generateComplaintCode()
  const exists = await prisma.complaint.findFirst({ where: { code }, select: { id: true } })
  if (exists) return createUniqueCode(attempt + 1)
  return code
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = complaintSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 })
    }
    const { hp_field, ...data } = parsed.data
    if (hp_field) {
      // honeypot triggered
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
    }
    // Rate limiting & Anti-Spam
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const rl = checkAndRecordLimits(ip, data.email, data.deskripsi)
    if (!rl.ok) {
      return NextResponse.json({ error: rl.code, message: rl.message }, { status: 429 })
    }
    const code = await createUniqueCode()
    const complaint = await prisma.complaint.create({
      data: {
        code,
        reporterName: data.namaLengkap,
        email: data.email,
        phone: data.nomorTelepon,
        classification: data.klasifikasi as any,
        description: data.deskripsi
      },
      select: { id: true, code: true, createdAt: true }
    })
  // Invalidate public complaints list cache (ISR tag)
  try { revalidateTag('complaints-public') } catch {}
    // Send WhatsApp notification (best effort, non-blocking)
    ;(async () => {
      try {
        if (process.env.FONNTE_TOKEN) {
          const baseUrl = process.env.APP_BASE_URL || ''
          const humanClassification = humanizeClassification(data.klasifikasi as any)
          const descClean = data.deskripsi.replace(/\s+/g,' ').trim()
          const descSnippet = descClean.length > 200 ? descClean.slice(0,197) + '...' : descClean
          const trackLink = baseUrl ? `${baseUrl}/status?ref=${complaint.code}` : ''
          const footer = process.env.WA_MESSAGE_FOOTER || 'Jangan balas pesan ini. Simpan kode untuk pelacakan.'
          const lines: string[] = []
          lines.push(`*Terima kasih, ${data.namaLengkap}*`) // greeting
          lines.push('Pengaduan Anda telah *diterima* ✅')
          lines.push('')
          lines.push(`*Kode:* ${complaint.code}`)
          lines.push(`*Klasifikasi:* ${humanClassification}`)
          lines.push(`*Deskripsi:* ${descSnippet}`)
          if (trackLink) {
            lines.push('')
            lines.push('Lacak Status: ')
            lines.push(trackLink)
          }
          lines.push('')
            lines.push(footer)
          const message = lines.join('\n')
          const resp = await sendWhatsAppMessage(data.nomorTelepon, message)
          try {
            await prisma.notification.create({
              data: {
                complaintId: complaint.id,
                channel: 'WHATSAPP',
                status: isFonnteSuccess(resp) ? 'SUCCESS' : 'FAILED',
                detail: JSON.stringify(isFonnteSuccess(resp) ? { detail: resp.detail, id: resp.id } : resp).slice(0, 950)
              }
            })
          } catch (e) {
            console.error('Gagal simpan Notification', e)
          }
        }
      } catch (e) {
        console.error('Gagal kirim WhatsApp notifikasi', e)
      }
    })()
    return NextResponse.json({ data: complaint })
  } catch (e: any) {
    console.error('POST /api/pengaduan error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

// GET /api/pengaduan?limit=5 -> daftar publik ringkas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')
    const adminFlag = searchParams.get('admin') // presence => admin view
    const limit = Math.min(Math.max(parseInt(limitParam || '5', 10) || 5, 1), 50)
    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
    const skip = (page - 1) * limit

    const [total, complaints] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: adminFlag ? {
          code: true,
          createdAt: true,
          classification: true,
          status: true,
          reporterName: true,
          email: true,
          phone: true,
          description: true,
          rtl: true,
          completedAt: true,
        } : {
          code: true,
          createdAt: true,
          classification: true,
          status: true,
        }
      })
    ])

    if (adminFlag) {
      const data = complaints.map((c: any) => ({
        id: c.code,
        tanggal: c.createdAt.toISOString(),
        nama: c.reporterName,
        email: c.email,
        noWA: c.phone,
        klasifikasi: humanizeClassification(c.classification),
        status: humanizeStatus(c.status),
        deskripsi: c.description,
        rtl: c.rtl || '',
        tanggalSelesai: c.completedAt ? c.completedAt.toISOString().slice(0,10) : ''
      }))
      return NextResponse.json({ data, page, limit, total })
    }

  // public shape
  const data = (complaints as any).map((c: any) => ({
      id: c.code,
      tanggal: c.createdAt.toISOString(),
      klasifikasi: humanizeClassification(c.classification),
      status: humanizeStatus(c.status)
    }))
    return NextResponse.json({ data, page, limit, total })
  } catch (e) {
    console.error('GET /api/pengaduan error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

// (humanize helpers now centralized in lib/humanize.ts)
