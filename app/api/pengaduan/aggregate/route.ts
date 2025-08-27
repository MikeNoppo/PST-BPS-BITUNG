import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { humanizeClassification } from '@/lib/humanize'

// GET /api/pengaduan/aggregate?year=2025
// Mengembalikan:
// {
//   year: 2025,
//   monthly: [ { month:1, count:10 }, ..., { month:12, count:0 } ],
//   classification: [ { key:"PROSEDUR_LAYANAN", label:"Prosedur Layanan", count:5 }, ... ],
//   generatedAt: ISO
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

    // Monthly aggregation (total only)
    const monthlyRows = await prisma.$queryRaw<{ month: number; count: bigint }[]>`
      SELECT EXTRACT(MONTH FROM "createdAt")::int AS month, COUNT(*)::bigint AS count
      FROM "Complaint"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY month
    `

    const monthlyMap: Record<number, number> = {}
    monthlyRows.forEach(r => { monthlyMap[r.month] = Number(r.count) })
    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: monthlyMap[i + 1] || 0 }))

    // Classification aggregation (total only)
    const classificationRows = await prisma.$queryRaw<{ classification: string; count: bigint }[]>`
      SELECT "classification" AS classification, COUNT(*)::bigint AS count
      FROM "Complaint"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY classification
      ORDER BY classification
    `

    const classification = classificationRows.map(r => ({
      key: r.classification,
      label: humanizeClassification(r.classification),
      count: Number(r.count)
    }))

    return NextResponse.json({
      year,
      monthly,
      classification,
      generatedAt: new Date().toISOString()
    })
  } catch (e) {
    console.error('GET /api/pengaduan/aggregate error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

// humanize moved to lib/humanize.ts
