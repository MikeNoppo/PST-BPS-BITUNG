import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
    const limit = Math.min(Math.max(parseInt(limitParam || '5', 10) || 5, 1), 50)
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        code: true,
        createdAt: true,
        classification: true,
        status: true,
      }
    })
    // Map to public shape expected by table (id, tanggal, klasifikasi, status)
    const data = complaints.map(c => ({
      id: c.code,
      tanggal: c.createdAt.toISOString(),
      klasifikasi: humanizeClassification(c.classification),
      status: humanizeStatus(c.status)
    }))
    return NextResponse.json({ data })
  } catch (e) {
    console.error('GET /api/pengaduan error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

function humanizeClassification(c: string): string {
  const map: Record<string,string> = {
    PERSYARATAN_LAYANAN: 'Persyaratan Layanan',
    PROSEDUR_LAYANAN: 'Prosedur Layanan',
    WAKTU_PELAYANAN: 'Waktu Pelayanan',
    BIAYA_TARIF_PELAYANAN: 'Biaya/Tarif Pelayanan',
    PRODUK_PELAYANAN: 'Produk Pelayanan',
    KOMPETENSI_PELAKSANA_PELAYANAN: 'Kompetensi Pelaksana Pelayanan',
    PERILAKU_PETUGAS_PELAYANAN: 'Perilaku Petugas Pelayanan',
    SARANA_DAN_PRASARANA: 'Sarana dan Prasarana'
  }
  return map[c] || c
}

function humanizeStatus(s: string): string {
  const map: Record<string,string> = { BARU: 'Baru', PROSES: 'Proses', SELESAI: 'Selesai' }
  return map[s] || s
}
