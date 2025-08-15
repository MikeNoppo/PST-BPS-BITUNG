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
        <h2 className="text-2xl font-semibold text-blue-100 mb-2 drop-shadow-sm">Ringkasan Pengaduan</h2>
        <p className="text-sm text-blue-200/80">Statistik singkat status pengaduan terbaru.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-200/70">Total</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-blue-200">{total}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-300">Baru</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-blue-100">{baru}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-300">Proses</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-amber-200">{proses}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-300">Selesai</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-200">{selesai}</CardContent>
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
          className="bg-blue-900/40 border-blue-700/40"
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
          className="bg-blue-900/40 border-blue-700/40"
        />
      </div>
    </div>
  )
}
