import { prisma } from '@/lib/prisma'
import { humanizeClassification } from '@/lib/humanize'
import DashboardClient, { AggregateData, StatsYear } from '../../../components/admin/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const year = new Date().getFullYear()
  try {
    const [grouped, monthlyRows, classificationRows] = await Promise.all([
      prisma.complaint.groupBy({ by: ['status'], where: { createdAt: { gte: new Date(Date.UTC(year,0,1)), lt: new Date(Date.UTC(year+1,0,1)) } }, _count: { status: true } }),
      prisma.$queryRaw<{ month: number; count: bigint }[]>`SELECT EXTRACT(MONTH FROM "createdAt")::int AS month, COUNT(*)::bigint AS count FROM "Complaint" WHERE "createdAt" >= ${new Date(Date.UTC(year,0,1))} AND "createdAt" < ${new Date(Date.UTC(year+1,0,1))} GROUP BY month`,
      prisma.$queryRaw<{ classification: string; count: bigint }[]>`SELECT "classification" AS classification, COUNT(*)::bigint AS count FROM "Complaint" WHERE "createdAt" >= ${new Date(Date.UTC(year,0,1))} AND "createdAt" < ${new Date(Date.UTC(year+1,0,1))} GROUP BY classification ORDER BY classification`
    ])

    const counts: Record<string, number> = { BARU: 0, PROSES: 0, SELESAI: 0 }
    grouped.forEach(g => { counts[g.status] = g._count.status })
    const stats: StatsYear = {
      year,
      total: Object.values(counts).reduce((s,v)=>s+v,0),
      baru: counts.BARU,
      proses: counts.PROSES,
      selesai: counts.SELESAI,
      generatedAt: new Date().toISOString()
    }

    const monthlyMap: Record<number, number> = {}
    monthlyRows.forEach(r => { monthlyMap[r.month] = Number(r.count) })
    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: monthlyMap[i+1] || 0 }))
    const classification = classificationRows.map(r => ({ key: r.classification, label: humanizeClassification(r.classification), count: Number(r.count) }))
    const aggregate: AggregateData = { year, monthly, classification, generatedAt: new Date().toISOString() }

    return <DashboardClient stats={stats} aggregate={aggregate} />
  } catch (e) {
    console.error('Dashboard server load error', e)
    return <div className="p-6 text-sm text-red-300">Gagal memuat data dashboard.</div>
  }
}
