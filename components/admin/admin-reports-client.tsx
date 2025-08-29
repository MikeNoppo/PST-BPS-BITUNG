"use client";
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer } from 'lucide-react'
import { ExportDropdown, MONTHS, exportToCSV, exportToExcel } from '@/components/export-utils'
import { toast } from '@/hooks/use-toast'

export type Complaint = {
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

interface Props {
  years: string[]
  initialYear: string
  initialMonth: string
  initialReportType: 'monthly' | 'annual'
  initialData: Complaint[]
}

const monthName = (m: string) => MONTHS.find(mm => mm.value === m)?.label || m

export default function AdminReportsClient({ years, initialYear, initialMonth, initialReportType, initialData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [reportType, setReportType] = useState<'monthly' | 'annual'>(initialReportType)
  const [exporting, setExporting] = useState(false)
  const [userChangedMonth, setUserChangedMonth] = useState(false)
  const [exportingSheets, setExportingSheets] = useState(false)

  // Auto adjust month if no data for selected month (only on first render per SSR load)
  useEffect(() => {
    if (reportType !== 'monthly') return
    if (!initialData.length) return
    if (userChangedMonth) return
    const monthsWithData = new Set(initialData.map(c => String(new Date(c.tanggal).getMonth() + 1).padStart(2,'0')))
    if (!monthsWithData.has(month)) {
      const newestMonth = String(new Date(initialData[0].tanggal).getMonth() + 1).padStart(2,'0')
      setMonth(newestMonth)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reportType])

  // When core selectors change -> push new URL to trigger SSR
  const pushParams = (next: { year?: string; month?: string; type?: string }) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (next.year) params.set('year', next.year)
    if (next.month) params.set('month', next.month)
    if (next.type) params.set('type', next.type)
    router.push(`/admin/laporan?${params.toString()}`)
  }

  const monthlyData = useMemo(() => initialData
    .filter(c => new Date(c.tanggal).getMonth() + 1 === parseInt(month, 10))
    .sort((a,b)=> new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .map((c,i) => ({
      no: i+1,
      tanggal: c.tanggal,
      nama: c.nama,
      email: c.email,
      noWA: c.noWA,
      isiPengaduan: c.deskripsi,
      klasifikasi: c.klasifikasi,
      rtl: c.rtl || '-',
      status: c.status,
      tanggalSelesai: c.tanggalSelesai || '-',
    })), [initialData, month])

  const annualData = useMemo(() => initialData
    .sort((a,b)=> new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .map((c,i) => ({
      no: i+1,
      bulan: monthName(String(new Date(c.tanggal).getMonth()+1).padStart(2,'0')),
      klasifikasi: c.klasifikasi,
      status: c.status,
    })), [initialData])

  type ExportFormat = 'csv' | 'excel'
  const handleExport = async (fmt: ExportFormat) => {
    setExporting(true)
    try {
      const isMonthly = reportType === 'monthly'
      if (isMonthly) {
        const headers = ['No','Tanggal Pengaduan','Nama Pelapor','Email','No WhatsApp','Isi Pengaduan','Klasifikasi','RTL','Status','Tanggal Selesai']
        const monthLabel = monthName(month)
        const filename = `laporan-bulanan-${monthLabel}-${year}.${fmt === 'csv' ? 'csv' : 'xls'}`
        const mapper = (item: any) => [
          item.no,
          new Date(item.tanggal).toLocaleDateString('id-ID'),
          item.nama,
          item.email,
          item.noWA,
          item.isiPengaduan,
          item.klasifikasi,
          item.rtl,
          item.status,
          item.tanggalSelesai !== '-' ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-'
        ]
        fmt === 'csv'
          ? exportToCSV(monthlyData, headers, filename, mapper)
          : exportToExcel(monthlyData, headers, filename, mapper)
      } else {
        const headers = ['No','Bulan','Klasifikasi Pengaduan','Status Penanganan']
        const filename = `laporan-tahunan-${year}.${fmt === 'csv' ? 'csv' : 'xls'}`
        const mapper = (item: any) => [item.no, item.bulan, item.klasifikasi, item.status]
        fmt === 'csv'
          ? exportToCSV(annualData, headers, filename, mapper)
          : exportToExcel(annualData, headers, filename, mapper)
      }
    } finally { setExporting(false) }
  }

  const buildAnnualSummaryMatrix = () => {
    const order: string[] = [
      'PERSYARATAN LAYANAN',
      'PROSEDUR LAYANAN',
      'WAKTU PELAYANAN',
      'BIAYA / TARIF PELAYANAN',
      'PRODUK PELAYANAN',
      'KOMPETENSI PELAKSANA PELAYANAN',
      'PERILAKU PETUGAS PELAYANAN',
      'SARANA DAN PRASARANA'
    ]
    const counters = Array.from({ length: 12 }, (_, i) => ({
      bulanIndex: i,
      counts: Array(order.length).fill(0) as number[],
      proses: 0,
      selesai: 0,
    }))
    initialData.forEach(c => {
      const d = new Date(c.tanggal)
      const m = d.getMonth()
      const idx = counters[m]
      const klas = c.klasifikasi.toUpperCase()
      const pos = order.findIndex(o => klas.includes(o.split(' / ')[0]))
      if (pos >= 0) idx.counts[pos] += 1
      if (c.status === 'Proses') idx.proses += 1
      if (c.status === 'Selesai') idx.selesai += 1
    })
    return { order, rows: counters }
  }

  const exportAnnualSheets = async () => {
    if (!year) return
    setExportingSheets(true)
    try {
      const res = await fetch('/api/export/sheets/annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
      })
      if (!res.ok) throw new Error('Gagal export Sheets')
      const json = await res.json()
      toast({ title: 'Export berhasil', description: `Tab: ${json.sheet?.tab || ''}` })
      if (json.sheet?.url) window.open(json.sheet.url, '_blank')
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Export gagal', description: e.message || 'Terjadi kesalahan' })
    } finally { setExportingSheets(false) }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Baru':
        return <Badge className="bg-blue-800/40 border border-blue-600/40 text-blue-100 hover:bg-blue-700/50">Baru</Badge>
      case 'Proses':
        return <Badge className="bg-amber-800/30 border border-amber-600/40 text-amber-200 hover:bg-amber-700/40">Proses</Badge>
      case 'Selesai':
        return <Badge className="bg-emerald-800/30 border border-emerald-600/40 text-emerald-200 hover:bg-emerald-700/40">Selesai</Badge>
      default:
        return <Badge variant="outline" className="border-blue-700 text-blue-100">{status}</Badge>
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <Card className="bg-blue-900/40 border-blue-700/40">
        <CardHeader className="print:hidden">
          <CardTitle className="text-2xl text-blue-100">Cetak Laporan</CardTitle>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-200">Jenis Laporan</label>
              <Select value={reportType} onValueChange={(v)=> { setReportType(v as any); pushParams({ type: v }) }}>
                <SelectTrigger className="w-48 bg-blue-950/40 border-blue-700/40 text-blue-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Laporan Bulanan</SelectItem>
                  <SelectItem value="annual">Laporan Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-blue-200">Bulan</label>
                <Select value={month} onValueChange={(val) => { setMonth(val); setUserChangedMonth(true); pushParams({ month: val }) }}>
                  <SelectTrigger className="w-32 bg-blue-950/40 border-blue-700/40 text-blue-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-200">Tahun</label>
              <Select value={year} onValueChange={(val)=> { setYear(val); setUserChangedMonth(false); pushParams({ year: val }) }}>
                <SelectTrigger className="w-28 bg-blue-950/40 border-blue-700/40 text-blue-50">
                  <SelectValue placeholder={years.length ? 'Pilih' : '...'} />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrint} variant="soft" className="flex items-center space-x-2" disabled={!year || exporting}>
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </Button>
              <ExportDropdown
                onCSV={() => handleExport('csv')}
                onExcel={() => handleExport('excel')}
                disabled={!year || exporting || exportingSheets}
                count={reportType === 'monthly' ? monthlyData.length : annualData.length}
                onSheets={reportType === 'annual' ? exportAnnualSheets : undefined}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!year && (
            <div className="p-4 mb-4 border border-amber-500/40 bg-amber-900/20 text-amber-100 rounded-md text-sm">
              Pilih tahun terlebih dahulu untuk menampilkan data laporan.
            </div>
          )}
          {/* Print header */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">LAPORAN PENGADUAN PST BPS KOTA BITUNG</h1>
            <h2 className="text-lg font-semibold">
              {reportType === 'monthly' ? `Laporan Bulanan - ${monthName(month)} ${year}` : `Laporan Tahunan - ${year}`}
            </h2>
            <hr className="mt-4 mb-6" />
          </div>

          {reportType === 'monthly' && year && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-blue-900/60">
                  <TableRow>
                    <TableHead className="text-blue-100">No.</TableHead>
                    <TableHead className="text-blue-100">Tgl Pengaduan</TableHead>
                    <TableHead className="text-blue-100">Data Pelapor</TableHead>
                    <TableHead className="text-blue-100">Isi Pengaduan</TableHead>
                    <TableHead className="text-blue-100">Klasifikasi</TableHead>
                    <TableHead className="text-blue-100">RTL</TableHead>
                    <TableHead className="text-blue-100">Status</TableHead>
                    <TableHead className="text-blue-100">Tgl Selesai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-blue-200">Tidak ada data</TableCell></TableRow>
                  )}
                  {monthlyData.map(item => (
                    <TableRow key={item.no} className={item.no % 2 ? 'bg-blue-900/30' : 'bg-blue-900/10'}>
                      <TableCell className="text-blue-50">{item.no}</TableCell>
                      <TableCell className="text-blue-50">{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-blue-50">{item.nama}</div>
                          <div className="text-blue-200/80">{item.email}</div>
                          <div className="text-blue-200/80">{item.noWA}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm truncate text-blue-50" title={item.isiPengaduan}>{item.isiPengaduan}</div>
                      </TableCell>
                      <TableCell className="text-blue-100/90">{item.klasifikasi}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm truncate text-blue-50" title={item.rtl}>{item.rtl}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-blue-100/90">{item.tanggalSelesai !== '-' ? (item.tanggalSelesai ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === 'annual' && year && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-blue-900/60">
                  <TableRow>
                    <TableHead className="text-blue-100">No.</TableHead>
                    <TableHead className="text-blue-100">Bulan</TableHead>
                    <TableHead className="text-blue-100">Klasifikasi Pengaduan</TableHead>
                    <TableHead className="text-blue-100">Status Penanganan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annualData.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-blue-200">Tidak ada data</TableCell></TableRow>
                  )}
                  {annualData.map(item => (
                    <TableRow key={item.no} className={item.no % 2 ? 'bg-blue-900/30' : 'bg-blue-900/10'}>
                      <TableCell className="text-blue-50">{item.no}</TableCell>
                      <TableCell className="text-blue-50">{item.bulan}</TableCell>
                      <TableCell className="text-blue-100/90">{item.klasifikasi}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="hidden print:block mt-8 text-right">
            <p className="text-sm">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
            <div className="mt-8">
              <p className="text-sm">Kepala BPS Kota Bitung</p>
              <div className="mt-12">
                <p className="text-sm font-medium">_____________________</p>
                <p className="text-sm">NIP. ___________________</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
