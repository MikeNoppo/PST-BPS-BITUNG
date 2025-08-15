'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Printer } from 'lucide-react'
import { ExportDropdown, MONTHS, exportToCSV, exportToExcel } from '@/components/export-utils'

// Mock data for reports
const mockMonthlyData = [
  {
    no: 1,
    tanggal: '2024-01-15',
    nama: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    noWA: '08123456789',
    isiPengaduan: 'Prosedur pelayanan terlalu rumit...',
    klasifikasi: 'Prosedur Layanan',
    rtl: 'Prosedur telah disederhanakan',
    status: 'Selesai',
    tanggalSelesai: '2024-01-20',
  // notifikasiTerkirim removed
  },
  {
    no: 2,
    tanggal: '2024-01-14',
    nama: 'Siti Nurhaliza',
    email: 'siti@email.com',
    noWA: '08234567890',
    isiPengaduan: 'Waktu tunggu terlalu lama...',
    klasifikasi: 'Waktu Pelayanan',
    rtl: 'Evaluasi sistem antrian',
    status: 'Proses',
    tanggalSelesai: '-',
  // notifikasiTerkirim removed
  }
]

const mockAnnualData = [
  { no: 1, bulan: 'Januari', klasifikasi: 'Prosedur Layanan', status: 'Selesai' },
  { no: 2, bulan: 'Januari', klasifikasi: 'Waktu Pelayanan', status: 'Proses' },
  { no: 3, bulan: 'Januari', klasifikasi: 'Perilaku Petugas', status: 'Baru' },
  { no: 4, bulan: 'Februari', klasifikasi: 'Sarana Prasarana', status: 'Selesai' },
  { no: 5, bulan: 'Februari', klasifikasi: 'Prosedur Layanan', status: 'Proses' }
]

export default function AdminLaporan() {
  const [selectedMonth, setSelectedMonth] = useState('01')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [reportType, setReportType] = useState('monthly')

  const exportMonthlyToCSV = () => {
  const headers = ['No','Tanggal Pengaduan','Nama Pelapor','Email','No WhatsApp','Isi Pengaduan','Klasifikasi','RTL','Status','Tanggal Selesai']
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label
    exportToCSV(
      mockMonthlyData,
      headers,
      `laporan-bulanan-${monthName}-${selectedYear}.csv`,
      (item) => [
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
    )
  }
  const exportAnnualToCSV = () => {
    const headers = ['No','Bulan','Klasifikasi Pengaduan','Status Penanganan']
    exportToCSV(
      mockAnnualData,
      headers,
      `laporan-tahunan-${selectedYear}.csv`,
      (item) => [item.no, item.bulan, item.klasifikasi, item.status]
    )
  }
  const exportMonthlyToExcel = () => {
  const headers = ['No','Tanggal Pengaduan','Nama Pelapor','Email','No WhatsApp','Isi Pengaduan','Klasifikasi','RTL','Status','Tanggal Selesai']
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label
    exportToExcel(
      mockMonthlyData,
      headers,
      `laporan-bulanan-${monthName}-${selectedYear}.xls`,
      (item) => [
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
    )
  }
  const exportAnnualToExcel = () => {
    const headers = ['No','Bulan','Klasifikasi Pengaduan','Status Penanganan']
    exportToExcel(
      mockAnnualData,
      headers,
      `laporan-tahunan-${selectedYear}.xls`,
      (item) => [item.no, item.bulan, item.klasifikasi, item.status]
    )
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
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                <SelectTrigger className="w-24 bg-blue-950/40 border-blue-700/40 text-blue-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrint} variant="soft" className="flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </Button>
              <ExportDropdown
                onCSV={reportType === 'monthly' ? exportMonthlyToCSV : exportAnnualToCSV}
                onExcel={reportType === 'monthly' ? exportMonthlyToExcel : exportAnnualToExcel}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
              {/* Report Header for Print */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">
                  LAPORAN PENGADUAN PST BPS KOTA BITUNG
                </h1>
                <h2 className="text-lg font-semibold">
                  {reportType === 'monthly' 
                    ? `Laporan Bulanan - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : `Laporan Tahunan - ${selectedYear}`
                  }
                </h2>
                <hr className="mt-4 mb-6" />
              </div>

              {/* Monthly Report */}
              {reportType === 'monthly' && (
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
                      {mockMonthlyData.map((item) => (
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
              {reportType === 'annual' && (
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
                      {mockAnnualData.map((item) => (
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
