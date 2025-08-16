import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pengaduan/stats?year=2025
// Mengembalikan ringkasan jumlah pengaduan per status untuk 1 tahun (default: tahun berjalan)
// Response:
// {
//   year: 2025,
//   total: 123,
//   baru: 40,
//   proses: 50,
//   selesai: 33,
//   status: { BARU: 40, PROSES: 50, SELESAI: 33 },
//   generatedAt: '2025-08-16T10:20:30.000Z'
// }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const now = new Date()
    const currentYear = now.getFullYear()
    const year = yearParam ? parseInt(yearParam, 10) : currentYear
    if (isNaN(year) || year < 2000 || year > currentYear + 1) {
      return NextResponse.json({ error: 'INVALID_YEAR' }, { status: 400 })
    }

    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
    const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))

    // Ambil jumlah per status dengan groupBy
    const grouped = await prisma.complaint.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lt: end } },
      _count: { status: true }
    })

    const counts: Record<string, number> = { BARU: 0, PROSES: 0, SELESAI: 0 }
    grouped.forEach(g => { counts[g.status] = g._count.status })
    const total = Object.values(counts).reduce((s, v) => s + v, 0)

    return NextResponse.json({
      year,
      total,
      baru: counts.BARU,
      proses: counts.PROSES,
      selesai: counts.SELESAI,
      status: counts,
      generatedAt: new Date().toISOString()
    })
  } catch (e) {
    console.error('GET /api/pengaduan/stats error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
