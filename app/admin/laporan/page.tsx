'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Printer, Download } from 'lucide-react'

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
    notifikasiTerkirim: 'Ya'
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
    notifikasiTerkirim: 'Ya'
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
    const headers = [
      'No',
      'Tanggal Pengaduan',
      'Nama Pelapor',
      'Email',
      'No WhatsApp',
      'Isi Pengaduan',
      'Klasifikasi',
      'RTL',
      'Status',
      'Tanggal Selesai',
      'Notifikasi Terkirim'
    ]
    
    const csvContent = [
      headers.join(','),
      ...mockMonthlyData.map((item) => [
        item.no,
        new Date(item.tanggal).toLocaleDateString('id-ID'),
        `"${item.nama}"`,
        item.email,
        item.noWA,
        `"${item.isiPengaduan.replace(/"/g, '""')}"`,
        `"${item.klasifikasi}"`,
        `"${item.rtl.replace(/"/g, '""')}"`,
        item.status,
        item.tanggalSelesai !== '-' ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-',
        item.notifikasiTerkirim
      ].join(','))
    ].join('\n')
    
    const monthName = months.find(m => m.value === selectedMonth)?.label
    const filename = `laporan-bulanan-${monthName}-${selectedYear}.csv`
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportAnnualToCSV = () => {
    const headers = ['No', 'Bulan', 'Klasifikasi Pengaduan', 'Status Penanganan']
    
    const csvContent = [
      headers.join(','),
      ...mockAnnualData.map((item) => [
        item.no,
        item.bulan,
        `"${item.klasifikasi}"`,
        item.status
      ].join(','))
    ].join('\n')
    
    const filename = `laporan-tahunan-${selectedYear}.csv`
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportMonthlyToExcel = () => {
    const headers = [
      'No',
      'Tanggal Pengaduan',
      'Nama Pelapor',
      'Email',
      'No WhatsApp',
      'Isi Pengaduan',
      'Klasifikasi',
      'RTL',
      'Status',
      'Tanggal Selesai',
      'Notifikasi Terkirim'
    ]
    
    let excelContent = `
      <table border="1">
        <thead>
          <tr style="background-color: #3b82f6; color: white;">
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${mockMonthlyData.map((item) => `
            <tr>
              <td>${item.no}</td>
              <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
              <td>${item.nama}</td>
              <td>${item.email}</td>
              <td>${item.noWA}</td>
              <td>${item.isiPengaduan}</td>
              <td>${item.klasifikasi}</td>
              <td>${item.rtl}</td>
              <td>${item.status}</td>
              <td>${item.tanggalSelesai !== '-' ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</td>
              <td>${item.notifikasiTerkirim}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
    const monthName = months.find(m => m.value === selectedMonth)?.label
    const filename = `laporan-bulanan-${monthName}-${selectedYear}.xls`
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportAnnualToExcel = () => {
    const headers = ['No', 'Bulan', 'Klasifikasi Pengaduan', 'Status Penanganan']
    
    let excelContent = `
      <table border="1">
        <thead>
          <tr style="background-color: #3b82f6; color: white;">
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${mockAnnualData.map((item) => `
            <tr>
              <td>${item.no}</td>
              <td>${item.bulan}</td>
              <td>${item.klasifikasi}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
    const filename = `laporan-tahunan-${selectedYear}.xls`
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Baru':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Baru</Badge>
      case 'Proses':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Proses</Badge>
      case 'Selesai':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="print:hidden">
          <CardTitle className="text-2xl text-blue-900">Cetak Laporan</CardTitle>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Laporan</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
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
                <label className="block text-sm font-medium mb-1">Bulan</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
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
              <label className="block text-sm font-medium mb-1">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
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
              <Button onClick={handlePrint} variant="outline" className="flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </Button>
              <Button
                onClick={reportType === 'monthly' ? exportMonthlyToCSV : exportAnnualToCSV}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </Button>
              <Button
                onClick={reportType === 'monthly' ? exportMonthlyToExcel : exportAnnualToExcel}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </Button>
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
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Tgl Pengaduan</TableHead>
                        <TableHead>Data Pelapor</TableHead>
                        <TableHead>Isi Pengaduan</TableHead>
                        <TableHead>Klasifikasi</TableHead>
                        <TableHead>RTL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tgl Selesai</TableHead>
                        <TableHead>Notifikasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockMonthlyData.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell>{item.no}</TableCell>
                          <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{item.nama}</div>
                              <div className="text-gray-500">{item.email}</div>
                              <div className="text-gray-500">{item.noWA}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm truncate" title={item.isiPengaduan}>
                              {item.isiPengaduan}
                            </div>
                          </TableCell>
                          <TableCell>{item.klasifikasi}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm truncate" title={item.rtl}>
                              {item.rtl}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.tanggalSelesai !== '-' ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={item.notifikasiTerkirim === 'Ya' ? 'default' : 'secondary'}>
                              {item.notifikasiTerkirim}
                            </Badge>
                          </TableCell>
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
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Klasifikasi Pengaduan</TableHead>
                        <TableHead>Status Penanganan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAnnualData.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell>{item.no}</TableCell>
                          <TableCell>{item.bulan}</TableCell>
                          <TableCell>{item.klasifikasi}</TableCell>
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
