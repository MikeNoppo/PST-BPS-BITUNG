import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
