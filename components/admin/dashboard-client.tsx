"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HighlightedBarChart } from '@/components/ui/highlighted-bar-chart'
import { PieChart, Pie, LabelList, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

export interface AggregateData {
  year: number
  monthly: { month: number; count: number }[]
  classification: { key: string; label: string; count: number }[]
  generatedAt: string
}

export interface StatsYear {
  year: number
  total: number
  baru: number
  proses: number
  selesai: number
  generatedAt: string
}

interface Props {
  stats: StatsYear
  aggregate: AggregateData
}

export default function DashboardClient({ stats, aggregate }: Props) {
  const total = stats.total
  const baru = stats.baru
  const proses = stats.proses
  const selesai = stats.selesai

  const klasifikasiChart = useMemo(() => {
    const list = aggregate.classification || []
    return list.map(c => ({ klasifikasi: c.label, jumlah: c.count }))
  }, [aggregate])

  const palette = [
    '#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#60a5fa', '#f472b6', '#4ade80'
  ]

  const pieData = useMemo(() => klasifikasiChart.map((k,i) => ({ name: k.klasifikasi, value: k.jumlah, fill: palette[i % palette.length] })), [klasifikasiChart])

  const pieConfig: ChartConfig = useMemo(() => {
    const base: ChartConfig = { value: { label: 'Jumlah' } }
    klasifikasiChart.forEach((k,i) => { base[k.klasifikasi] = { label: k.klasifikasi.replace(/_/g,' '), color: palette[i % palette.length] } })
    return base
  }, [klasifikasiChart])

  const monthlyChart = useMemo(() => {
    const list = aggregate.monthly || []
    return list.map(m => ({
      month: m.month,
      label: new Date(2000, m.month - 1, 1).toLocaleString('id-ID', { month: 'short' }),
      count: m.count
    }))
  }, [aggregate])

  // optional interactive state placeholder
  const [showPct, setShowPct] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-blue-100 mb-2 drop-shadow-sm">Ringkasan Pengaduan</h2>
          <p className="text-sm text-blue-200/80">Statistik singkat status pengaduan terbaru.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: total, clsTitle: 'text-blue-200/70', clsValue: 'text-blue-200' },
          { label: 'Baru', value: baru, clsTitle: 'text-blue-300', clsValue: 'text-blue-100' },
          { label: 'Proses', value: proses, clsTitle: 'text-amber-300', clsValue: 'text-amber-200' },
          { label: 'Selesai', value: selesai, clsTitle: 'text-emerald-300', clsValue: 'text-emerald-200' }
        ].map(card => (
          <Card key={card.label} className="relative bg-gradient-to-br from-blue-900/50 via-blue-900/40 to-blue-800/40 border border-blue-700/40 shadow-sm overflow-hidden">
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent" />
            <CardHeader className="pb-2"><CardTitle className={`text-sm font-medium ${card.clsTitle}`}>{card.label}</CardTitle></CardHeader>
            <CardContent className={`text-3xl font-semibold ${card.clsValue}`}>{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
                  content={<ChartTooltipContent hideLabel nameKey="value" formatter={(val, _name, item) => {
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
                  }} />}
                />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={110} paddingAngle={3} cornerRadius={6} stroke="#0f1e3a" strokeWidth={2}>
                  {pieData.map((entry,i) => <Cell key={entry.name} fill={entry.fill} />) }
                  <LabelList dataKey="value" stroke="none" fontSize={11} fill="currentColor" formatter={(v:number)=> showPct ? '' : v.toString()} />
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
