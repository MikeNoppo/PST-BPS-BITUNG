import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/pengaduan/[code] -> detail ringkas untuk pelacakan publik
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const rawCode = params.code
  if (!rawCode) {
    return NextResponse.json({ error: 'MISSING_CODE' }, { status: 400 })
  }
  try {
    const code = decodeURIComponent(rawCode).trim().toUpperCase()
    const complaint = await prisma.complaint.findFirst({
      where: { code },
      select: {
        code: true,
        createdAt: true,
        status: true,
        classification: true,
        description: true,
        rtl: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, note: true, createdAt: true }
        }
      }
    })
    if (!complaint) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Derive keterangan: prioritaskan note terbaru, fallback ke rtl, fallback generic by status
    const latest = complaint.updates[0]
    let keterangan = latest?.note || complaint.rtl || ''
    if (!keterangan) {
      switch (complaint.status) {
        case 'BARU':
          keterangan = 'Pengaduan telah diterima dan menunggu proses tindak lanjut.'
          break
        case 'PROSES':
          keterangan = 'Pengaduan sedang dalam proses penanganan.'
          break
        case 'SELESAI':
          keterangan = 'Pengaduan telah diselesaikan.'
          break
        default:
          keterangan = 'Status pengaduan tersedia.'
      }
    }

    return NextResponse.json({
      data: {
        code: complaint.code,
        createdAt: complaint.createdAt,
        status: complaint.status,
        classification: complaint.classification,
        keterangan,
        latestUpdate: latest || null
      }
    })
  } catch (e) {
    console.error('GET /api/pengaduan/[code] error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

// PATCH /api/pengaduan/[code] -> update RTL, status, completedAt (YYYY-MM-DD)
export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  const rawCode = params.code
  if (!rawCode) return NextResponse.json({ error: 'MISSING_CODE' }, { status: 400 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })

  const schema = z.object({
    rtl: z.string().max(1500).optional(),
    status: z.enum(['BARU','PROSES','SELESAI']).optional(),
    tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 })

  try {
    const code = decodeURIComponent(rawCode).trim().toUpperCase()
    const existing = await prisma.complaint.findFirst({ where: { code }, select: { id: true, status: true } })
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const { rtl, status, tanggalSelesai } = parsed.data
    const data: any = {}
    if (rtl !== undefined) data.rtl = rtl
    if (status) data.status = status as any
    if (tanggalSelesai) data.completedAt = new Date(tanggalSelesai + 'T00:00:00Z')

    const updated = await prisma.complaint.update({
      where: { id: existing.id },
      data,
      select: { code: true, status: true, rtl: true, completedAt: true }
    })

    // create status update record when status changed
    if (status) {
      await prisma.statusUpdate.create({ data: { complaintId: existing.id, status: status as any } })
    }

    return NextResponse.json({ data: {
      code: updated.code,
      status: updated.status,
      rtl: updated.rtl,
      tanggalSelesai: updated.completedAt ? updated.completedAt.toISOString().slice(0,10) : ''
    } })
  } catch (e) {
    console.error('PATCH /api/pengaduan/[code] error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
