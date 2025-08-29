"use client"

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HighlightedBarChart } from '@/components/ui/highlighted-bar-chart'
import { PieChart, Pie, LabelList, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
// import { Badge } from '@/components/ui/badge' // (tidak terpakai saat ini)

interface AggregateData {
  year: number
  monthly: { month: number; count: number }[]
  classification: { key: string; label: string; count: number }[]
  generatedAt: string
}

interface StatsYear {
  year: number
  total: number
  baru: number
  proses: number
  selesai: number
  generatedAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsYear | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [errorStats, setErrorStats] = useState<string | null>(null)
  const [aggregate, setAggregate] = useState<AggregateData | null>(null)
  const [loadingAgg, setLoadingAgg] = useState(true)
  const [errorAgg, setErrorAgg] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        setLoadingStats(true)
        const year = new Date().getFullYear()
        const res = await fetch(`/api/pengaduan/stats?year=${year}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setStats(json)
      } catch (e: any) {
        if (e.name !== 'AbortError') setErrorStats(e.message || 'Gagal memuat statistik')
      } finally {
        setLoadingStats(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadAgg() {
      try {
        setLoadingAgg(true)
        const year = new Date().getFullYear()
        const res = await fetch(`/api/pengaduan/aggregate?year=${year}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setAggregate(json)
      } catch (e: any) {
        if (e.name !== 'AbortError') setErrorAgg(e.message || 'Gagal memuat agregasi')
      } finally {
        setLoadingAgg(false)
      }
    }
    loadAgg()
    return () => controller.abort()
  }, [])

  const total = stats?.total ?? 0
  const baru = stats?.baru ?? 0
  const proses = stats?.proses ?? 0
  const selesai = stats?.selesai ?? 0

  const klasifikasiChart = useMemo(() => {
    const list = aggregate?.classification
    if (!Array.isArray(list)) return [] as { klasifikasi: string; jumlah: number }[]
    return list.map(c => ({ klasifikasi: c.label, jumlah: c.count }))
  }, [aggregate])

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
    const list = aggregate?.monthly
    if (!Array.isArray(list)) return [] as { month: number; label: string; count: number }[]
    return list.map(m => ({
      month: m.month,
      label: new Date(2000, m.month - 1, 1).toLocaleString('id-ID', { month: 'short' }),
      count: m.count
    }))
  }, [aggregate])

  // (state interaksi klasifikasi belum digunakan; dihapus untuk mencegah warning)

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
          <CardContent className="text-3xl font-semibold text-blue-200">{loadingStats ? '…' : total}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-300">Baru</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-blue-100">{loadingStats ? '…' : baru}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-300">Proses</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-amber-200">{loadingStats ? '…' : proses}</CardContent>
        </Card>
        <Card className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-300">Selesai</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-200">{loadingStats ? '…' : selesai}</CardContent>
        </Card>
      </div>
      {errorStats && (
        <p className="text-xs text-red-300">Gagal memuat statistik: {errorStats}</p>
      )}
      {errorAgg && (
        <p className="text-xs text-red-300">Gagal memuat data chart: {errorAgg}</p>
      )}
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
      {(loadingAgg) && (
        <p className="text-xs text-blue-300/70">Memuat data chart…</p>
      )}
    </div>
  )
}
