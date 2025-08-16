"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HighlightedBarChart } from '@/components/ui/highlighted-bar-chart'
import { PieChart, Pie, LabelList, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
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

  // Palet warna disesuaikan agar kontras & harmonis dengan background biru gelap.
  const palette = [
    '#38bdf8', // sky-400
    '#34d399', // emerald-400
    '#a78bfa', // violet-400
    '#fbbf24', // amber-400
    '#fb7185', // rose-400
    '#60a5fa', // blue-400
    '#f472b6', // pink-400
    '#4ade80', // green-400
  ]

  const pieData = useMemo(() => klasifikasiChart.map((k,i) => ({ name: k.klasifikasi, value: k.jumlah, fill: palette[i % palette.length] })), [klasifikasiChart])

  // Konfigurasi label tooltip/legend (warna diinject agar bisa dipakai indikator)
  const pieConfig: ChartConfig = useMemo(() => {
    const base: ChartConfig = { value: { label: 'Jumlah' } }
    klasifikasiChart.forEach((k,i) => { base[k.klasifikasi] = { label: k.klasifikasi.replace(/_/g,' '), color: palette[i % palette.length] } })
    return base
  }, [klasifikasiChart])

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
        {/* Pie Chart Distribusi Klasifikasi Pengaduan */}
        <Card className="bg-blue-900/40 border-blue-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100 text-base">Distribusi Klasifikasi Pengaduan</CardTitle>
            <CardDescription className="text-blue-300/70">Proporsi jumlah pengaduan per klasifikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[300px] [&_.recharts-text]:fill-background">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    hideLabel
                    nameKey="value"
                    formatter={(val, _name, item) => {
                      const total = pieData.reduce((s,d)=>s+d.value,0)
                      const pct = total ? ((item?.value as number)/total*100).toFixed(1) : '0'
                      const key = (item?.name as string)||''
                      const label = key.replace(/_/g,' ')
                      return (
                        <div className="flex w-full justify-between gap-4">
                          <span className="text-foreground font-medium">{label}</span>
                          <span className="font-mono text-foreground">{item?.value} <span className="text-muted-foreground">({pct}%)</span></span>
                        </div>
                      )
                    }}
                  />}
                />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={110} paddingAngle={3} cornerRadius={6} stroke="#0f1e3a" strokeWidth={2}>
                  {pieData.map((entry,i) => <Cell key={entry.name} fill={entry.fill} />) }
                  <LabelList dataKey="value" stroke="none" fontSize={11} fill="currentColor" formatter={(v:number)=>v.toString()} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
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
