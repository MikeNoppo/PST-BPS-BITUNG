'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Printer } from 'lucide-react'
import { ExportDropdown, MONTHS, exportToCSV, exportToExcel } from '@/components/export-utils'

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

export default function AdminLaporan() {
  const [selectedMonth, setSelectedMonth] = useState('01')
  const [userChangedMonth, setUserChangedMonth] = useState(false)
  const [selectedYear, setSelectedYear] = useState('')
  const [reportType, setReportType] = useState('monthly')
  const [allYearData, setAllYearData] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [years, setYears] = useState<string[]>([])

  // Fetch distinct years from dedicated endpoint
  const fetchYears = useCallback(async () => {
    try {
      const res = await fetch('/api/pengaduan/years')
      if (!res.ok) throw new Error('Gagal memuat tahun')
      const json = await res.json()
  const list: string[] = json.years || json.data?.years || []
      setYears(list)
      if (list.length && !selectedYear) setSelectedYear(list[0])
    } catch {}
  }, [selectedYear])

  const fetchYearData = useCallback(async (year: string) => {
    // Abort any ongoing fetch for previous year
    if (controllerRef.current) {
      try { controllerRef.current.abort() } catch {}
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true); setError(null)
    const limit = 50
    let page = 1
    let acc: Complaint[] = []
    try {
      while (true) {
        const res = await fetch(`/api/pengaduan?admin=1&year=${year}&limit=${limit}&page=${page}`, { signal: controller.signal })
        if (!res.ok) throw new Error('Fetch gagal')
        const json = await res.json()
        const data: Complaint[] = json.data || []
        acc = acc.concat(data)
        if (!json.data || json.data.length < limit) break
        page += 1
        if (page > 20) break // safety cap
      }
      // If aborted, skip state update
      if (!controller.signal.aborted) {
        setAllYearData(acc)
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // Silent abort
        return
      }
      setError(e.message || 'Gagal memuat data')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  // Initial fetch of years
  useEffect(() => { fetchYears() }, [fetchYears])

  // Fetch whenever selected year changes (after initialization)
  useEffect(() => { if (selectedYear) fetchYearData(selectedYear) }, [selectedYear, fetchYearData])
  // Reset month change flag when year changes
  useEffect(() => { setUserChangedMonth(false) }, [selectedYear])
  // Auto-select month with data if current month empty (unless user changed)
  useEffect(() => {
    if (reportType !== 'monthly') return
    if (!allYearData.length) return
    if (userChangedMonth) return
    const monthsWithData = new Set(allYearData.map(c => String(new Date(c.tanggal).getMonth() + 1).padStart(2,'0')))
    if (!monthsWithData.has(selectedMonth)) {
      const newestMonth = String(new Date(allYearData[0].tanggal).getMonth() + 1).padStart(2,'0')
      setSelectedMonth(newestMonth)
    }
  }, [allYearData, selectedMonth, userChangedMonth, reportType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        try { controllerRef.current.abort() } catch {}
      }
    }
  }, [])

  const monthName = (m: string) => MONTHS.find(mm => mm.value === m)?.label || m

  const monthlyData = allYearData
    .filter(c => new Date(c.tanggal).getMonth() + 1 === parseInt(selectedMonth, 10))
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
    }))

  const annualData = allYearData
    .sort((a,b)=> new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .map((c,i) => ({
      no: i+1,
      bulan: monthName(String(new Date(c.tanggal).getMonth()+1).padStart(2,'0')),
      klasifikasi: c.klasifikasi,
      status: c.status,
    }))

  type ExportFormat = 'csv' | 'excel'
  const handleExport = async (fmt: ExportFormat) => {
    if (!selectedYear) return
    setExporting(true)
    try {
      const isMonthly = reportType === 'monthly'
      if (isMonthly) {
        const headers = ['No','Tanggal Pengaduan','Nama Pelapor','Email','No WhatsApp','Isi Pengaduan','Klasifikasi','RTL','Status','Tanggal Selesai']
        const monthLabel = monthName(selectedMonth)
        const filename = `laporan-bulanan-${monthLabel}-${selectedYear}.${fmt === 'csv' ? 'csv' : 'xls'}`
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
        const filename = `laporan-tahunan-${selectedYear}.${fmt === 'csv' ? 'csv' : 'xls'}`
        const mapper = (item: any) => [item.no, item.bulan, item.klasifikasi, item.status]
        fmt === 'csv'
          ? exportToCSV(annualData, headers, filename, mapper)
          : exportToExcel(annualData, headers, filename, mapper)
      }
    } finally {
      setExporting(false)
    }
  }

  // Annual summary table (12 rows) for Google Sheets import
  const buildAnnualSummaryMatrix = () => {
    // Klasifikasi mapping order (as per schema order) -> label human
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
    // Normalisasi nama klasifikasi pada data (sudah humanize di API)
    const counters = Array.from({ length: 12 }, (_, i) => ({
      bulanIndex: i,
      counts: Array(order.length).fill(0) as number[],
      proses: 0,
      selesai: 0,
    }))
    allYearData.forEach(c => {
      const d = new Date(c.tanggal)
      const m = d.getMonth() // 0-11
      const idx = counters[m]
      const klas = c.klasifikasi.toUpperCase()
      const pos = order.findIndex(o => klas.includes(o.split(' / ')[0]))
      if (pos >= 0) idx.counts[pos] += 1
      if (c.status === 'Proses') idx.proses += 1
      if (c.status === 'Selesai') idx.selesai += 1
    })
    return { order, rows: counters }
  }

  const exportAnnualSheets = () => {
    const { order, rows } = buildAnnualSummaryMatrix()
    const header = ['No.', 'Bulan', ...order.map((_,i)=> (i+1).toString()), 'Dalam Proses', 'Selesai']
    const monthLabels = MONTHS.map(m=>m.label)
    const body = rows.map((r,i)=> [
      i+1,
      monthLabels[i],
      ...r.counts,
      r.proses || '0',
      r.selesai ? r.selesai : 'NIHIL'
    ])
    const footerLines = order.map((o,i)=> `${i+1}. ${o[0] + o.slice(1).toLowerCase()}`)
    const csvLines = [header, ...body]
    // Add blank line and footnotes
    csvLines.push([])
    footerLines.forEach(l => csvLines.push([`*) ${l}`]))
    const csvContent = csvLines.map(line => line.map(f => {
      const s = String(f)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
    }).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-tahunan-ringkas-${selectedYear}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const handlePrint = () => {
    window.print()
  }

  const months = MONTHS

  return (
    <div className="space-y-6">
      <Card className="bg-blue-900/40 border-blue-700/40">
        <CardHeader className="print:hidden">
          <CardTitle className="text-2xl text-blue-100">Cetak Laporan</CardTitle>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-200">Jenis Laporan</label>
              <Select value={reportType} onValueChange={setReportType}>
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
                <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setUserChangedMonth(true) }}>
                  <SelectTrigger className="w-32 bg-blue-950/40 border-blue-700/40 text-blue-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-200">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 bg-blue-950/40 border-blue-700/40 text-blue-50">
                  <SelectValue placeholder={years.length ? 'Pilih' : '...'} />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrint} variant="soft" className="flex items-center space-x-2" disabled={!selectedYear || loading || exporting}>
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </Button>
              <ExportDropdown
                onCSV={() => handleExport('csv')}
                onExcel={() => handleExport('excel')}
                disabled={!selectedYear || loading || exporting}
                count={reportType === 'monthly' ? monthlyData.length : annualData.length}
                onSheets={reportType === 'annual' ? exportAnnualSheets : undefined}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
              {/* Validation: no year selected */}
              {!selectedYear && (
                <div className="p-4 mb-4 border border-amber-500/40 bg-amber-900/20 text-amber-100 rounded-md text-sm">
                  Pilih tahun terlebih dahulu untuk menampilkan data laporan.
                </div>
              )}
              {/* Report Header for Print */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">
                  LAPORAN PENGADUAN PST BPS KOTA BITUNG
                </h1>
                <h2 className="text-lg font-semibold">
                  {reportType === 'monthly' 
                    ? `Laporan Bulanan - ${monthName(selectedMonth)} ${selectedYear}`
                    : `Laporan Tahunan - ${selectedYear}`
                  }
                </h2>
                <hr className="mt-4 mb-6" />
              </div>

              {/* Monthly Report */}
              {reportType === 'monthly' && selectedYear && (
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
                        {/* Notifikasi column removed */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && (
                        <TableRow><TableCell colSpan={8} className="text-center text-blue-200">Memuat...</TableCell></TableRow>
                      )}
                      {!loading && monthlyData.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-blue-200">Tidak ada data</TableCell></TableRow>
                      )}
                      {monthlyData.map((item) => (
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
                            <div className="text-sm truncate text-blue-50" title={item.isiPengaduan}>
                              {item.isiPengaduan}
                            </div>
                          </TableCell>
                          <TableCell className="text-blue-100/90">{item.klasifikasi}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm truncate text-blue-50" title={item.rtl}>
                              {item.rtl}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-blue-100/90">{item.tanggalSelesai !== '-' ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Annual Report */}
              {reportType === 'annual' && selectedYear && (
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
                      {loading && (
                        <TableRow><TableCell colSpan={4} className="text-center text-blue-200">Memuat...</TableCell></TableRow>
                      )}
                      {!loading && annualData.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-blue-200">Tidak ada data</TableCell></TableRow>
                      )}
                      {annualData.map((item) => (
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

              {/* Print Footer */}
              <div className="hidden print:block mt-8 text-right">
                <p className="text-sm">
                  Dicetak pada: {new Date().toLocaleDateString('id-ID')}
                </p>
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
