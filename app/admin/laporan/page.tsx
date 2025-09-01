import { prisma } from '@/lib/prisma'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'
import AdminReportsClient from '../../../components/admin/admin-reports-client'

// Local type for data sent to client component
type Complaint = {
  id: string
  tanggal: string
  nama: string
  email: string
  noWA: string
  klasifikasi: string
  status: string
  deskripsi: string
  rtl: string
  tanggalSelesai: string
}

export const dynamic = 'force-dynamic'

export default async function AdminLaporan({
  searchParams,
}: {
  // In Next.js newer versions searchParams may be a Promise that must be awaited
  searchParams?: any
}) {
  // Support both sync object and Promise form
  const resolved = searchParams && typeof searchParams.then === 'function' ? await searchParams : (searchParams || {})
  const params: { [key: string]: string | string[] | undefined } = resolved

  // Distinct years desc
  const yearsRows = await prisma.$queryRaw<{ year: number }[]>`SELECT DISTINCT EXTRACT(YEAR FROM "createdAt")::int AS year FROM "Complaint" ORDER BY year DESC`
  const years = yearsRows.map(r => r.year.toString())

  const yearParam = typeof params.year === 'string' ? params.year : Array.isArray(params.year) ? params.year[0] : undefined
  const typeParam = typeof params.type === 'string' ? params.type : Array.isArray(params.type) ? params.type[0] : undefined
  const monthParam = typeof params.month === 'string' ? params.month : Array.isArray(params.month) ? params.month[0] : undefined

  const selectedYear = yearParam && years.includes(yearParam) ? yearParam : (years[0] || '')
  const reportType = (typeParam === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual'
  const selectedMonth = (monthParam || '01').padStart(2, '0')

  let allYearData: Complaint[] = []
  if (selectedYear) {
    const yearNum = parseInt(selectedYear, 10)
    if (reportType === 'annual') {
      const start = new Date(Date.UTC(yearNum, 0, 1))
      const end = new Date(Date.UTC(yearNum + 1, 0, 1))
      const complaints = await prisma.complaint.findMany({
        where: { createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: 'desc' },
        select: { code: true, createdAt: true, classification: true, status: true, reporterName: true, email: true, phone: true, description: true, rtl: true, completedAt: true }
      })
      allYearData = complaints.map(c => ({
        id: c.code,
        tanggal: c.createdAt.toISOString(),
        nama: c.reporterName,
        email: c.email,
        noWA: c.phone,
        klasifikasi: humanizeClassification(c.classification as any),
        status: humanizeStatus(c.status as any),
        deskripsi: c.description,
        rtl: c.rtl || '',
        tanggalSelesai: c.completedAt ? c.completedAt.toISOString().slice(0, 10) : ''
      }))
    } else {
      const monthNum = parseInt(selectedMonth, 10) - 1
      const start = new Date(Date.UTC(yearNum, monthNum, 1))
      const end = new Date(Date.UTC(yearNum, monthNum + 1, 1))
      const complaints = await prisma.complaint.findMany({
        where: { createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: 'desc' },
        select: { code: true, createdAt: true, classification: true, status: true, reporterName: true, email: true, phone: true, description: true, rtl: true, completedAt: true }
      })
      allYearData = complaints.map(c => ({
        id: c.code,
        tanggal: c.createdAt.toISOString(),
        nama: c.reporterName,
        email: c.email,
        noWA: c.phone,
        klasifikasi: humanizeClassification(c.classification as any),
        status: humanizeStatus(c.status as any),
        deskripsi: c.description,
        rtl: c.rtl || '',
        tanggalSelesai: c.completedAt ? c.completedAt.toISOString().slice(0, 10) : ''
      }))
    }
  }

  return (
    <AdminReportsClient
      years={years}
      initialYear={selectedYear}
      initialMonth={selectedMonth}
      initialReportType={reportType}
      initialData={allYearData}
    />
  )
}
