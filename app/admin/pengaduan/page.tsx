import { prisma } from '@/lib/prisma'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'
import AdminComplaintsClient, { type ComplaintRow } from '@/components/admin/admin-complaints-client'

// SSR + streaming friendly (can be cached/tagged later)
export const dynamic = 'force-dynamic'

export default async function PengaduanPage() {
  const limit = 8
  const page = 1
  const [total, complaints] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: limit,
      select: {
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
      }
    })
  ])

  const initial: ComplaintRow[] = complaints.map(c => ({
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

  return <AdminComplaintsClient initialItems={initial} initialTotal={total} initialPage={page} pageSize={limit} />
}
