import { prisma } from '@/lib/prisma'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'
import AdminReportsClient from '../../../components/admin/admin-reports-client'

// Definisikan ulang tipe Complaint lokal untuk menghindari masalah resolusi tipe lint sementara
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

interface PageProps { searchParams?: { year?: string; month?: string; type?: string } }

export const dynamic = 'force-dynamic'

export default async function AdminLaporan({ searchParams }: PageProps) {
  // Ambil distinct year (desc)
  const yearsRows = await prisma.$queryRaw<{ year: number }[]>`SELECT DISTINCT EXTRACT(YEAR FROM "createdAt")::int AS year FROM "Complaint" ORDER BY year DESC`
  const years = yearsRows.map(r => r.year.toString())
  const selectedYear = searchParams?.year && years.includes(searchParams.year) ? searchParams.year : (years[0] || '')
  const reportType = (searchParams?.type === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual'
  const selectedMonth = (searchParams?.month || '01').padStart(2,'0')

  let allYearData: Complaint[] = []
  if (selectedYear) {
    const start = new Date(Date.UTC(parseInt(selectedYear,10),0,1))
    const end = new Date(Date.UTC(parseInt(selectedYear,10)+1,0,1))
    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
      select: {
        code: true, createdAt: true, classification: true, status: true,
        reporterName: true, email: true, phone: true, description: true, rtl: true, completedAt: true
      }
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
      tanggalSelesai: c.completedAt ? c.completedAt.toISOString().slice(0,10) : ''
    }))
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
