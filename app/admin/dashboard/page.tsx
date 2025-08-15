"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HighlightedBarChart } from '@/components/ui/highlighted-bar-chart'
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'

// Data mock ringkasan (gantikan dengan fetch server nanti)
const DATA = [
  { id: 'PGD001', tanggal: '2024-01-15', status: 'Selesai', klasifikasi: 'Prosedur Layanan' },
  { id: 'PGD002', tanggal: '2024-01-14', status: 'Proses', klasifikasi: 'Waktu Pelayanan' },
  { id: 'PGD003', tanggal: '2024-01-13', status: 'Baru', klasifikasi: 'Perilaku Petugas Pelayanan' }
]

export default function AdminDashboard() {
  const total = DATA.length
  const baru = DATA.filter(d => d.status === 'Baru').length
  const proses = DATA.filter(d => d.status === 'Proses').length
  const selesai = DATA.filter(d => d.status === 'Selesai').length

  const klasifikasiChart = useMemo(() => {
    const m: Record<string, number> = {}
    DATA.forEach(d => { m[d.klasifikasi] = (m[d.klasifikasi] || 0) + 1 })
    return Object.entries(m).map(([klasifikasi, jumlah]) => ({ klasifikasi, jumlah }))
  }, [])

  // Monthly complaints (dummy aggregation based on DATA dates; in real app fetch aggregated counts)
  const monthlyChart = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }))
    DATA.forEach(d => {
      const m = new Date(d.tanggal).getMonth()
      months[m].count += 1
    })
    // Ensure label formatting
    return months.map(m => ({ month: m.month, label: new Date(2024, m.month - 1, 1).toLocaleString('id-ID', { month: 'short' }), count: m.count }))
  }, [])

  const [activeKlas, setActiveKlas] = useState<number | null>(null)
  const activeKlasData = activeKlas === null ? null : klasifikasiChart[activeKlas]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-blue-900 mb-2">Ringkasan Pengaduan</h2>
        <p className="text-sm text-gray-600">Statistik singkat status pengaduan terbaru.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-blue-700">{total}</CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-600">Baru</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{baru}</CardContent>
        </Card>
        <Card className="border-orange-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-600">Proses</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-orange-700">{proses}</CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Selesai</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-green-700">{selesai}</CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <HighlightedBarChart
          title="Distribusi Klasifikasi Pengaduan"
          data={klasifikasiChart}
          xKey="klasifikasi"
          yKey="jumlah"
          description="Ringkasan jumlah pengaduan per klasifikasi"
          valueLabel="Klasifikasi"
          color="var(--chart-1)"
          shortLabel={(v: string) => v.length > 10 ? v.slice(0,10)+'…' : v}
          formatValue={(v) => v.toString()}
        />
        <HighlightedBarChart
          title="Jumlah Pengaduan Masuk (Tahun Berjalan)"
          data={monthlyChart}
          xKey="label"
            yKey="count"
          description="Total pengaduan per bulan"
          valueLabel="Pengaduan"
          color="var(--chart-2)"
          shortLabel={(v: string) => v}
          formatValue={(v) => v.toString()}
        />
      </div>
    </div>
  )
}
