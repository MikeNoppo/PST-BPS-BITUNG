"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

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
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [])

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi Klasifikasi Pengaduan</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={klasifikasiChart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
