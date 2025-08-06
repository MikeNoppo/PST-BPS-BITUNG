'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogOut, Edit, Send, FileText, BarChart3, CheckCircle, Download } from 'lucide-react'

// Mock data for admin dashboard
const mockComplaintsData = [
  {
    id: 'PGD001',
    tanggal: '2024-01-15',
    nama: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    noWA: '08123456789',
    klasifikasi: 'Prosedur Layanan',
    status: 'Selesai',
    deskripsi: 'Prosedur pelayanan terlalu rumit dan memakan waktu lama',
    rtl: 'Prosedur telah disederhanakan dan waktu pelayanan dipercepat',
    tanggalSelesai: '2024-01-20'
  },
  {
    id: 'PGD002',
    tanggal: '2024-01-14',
    nama: 'Siti Nurhaliza',
    email: 'siti@email.com',
    noWA: '08234567890',
    klasifikasi: 'Waktu Pelayanan',
    status: 'Proses',
    deskripsi: 'Waktu tunggu terlalu lama untuk mendapatkan layanan',
    rtl: 'Sedang dilakukan evaluasi sistem antrian',
    tanggalSelesai: ''
  },
  {
    id: 'PGD003',
    tanggal: '2024-01-13',
    nama: 'Budi Santoso',
    email: 'budi@email.com',
    noWA: '08345678901',
    klasifikasi: 'Perilaku Petugas Pelayanan',
    status: 'Baru',
    deskripsi: 'Petugas kurang ramah dalam memberikan pelayanan',
    rtl: '',
    tanggalSelesai: ''
  }
]

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState(mockComplaintsData)
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notification, setNotification] = useState('')
  const router = useRouter()

  const exportToCSV = (data: any[], filename: string) => {
    const headers = [
      'No',
      'Nomor Pengaduan',
      'Tanggal Pengaduan',
      'Nama Pelapor',
      'Email',
      'No WhatsApp',
      'Klasifikasi',
      'Deskripsi',
      'Status',
      'RTL',
      'Tanggal Selesai'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map((complaint, index) => [
        index + 1,
        complaint.id,
        new Date(complaint.tanggal).toLocaleDateString('id-ID'),
        `"${complaint.nama}"`,
        complaint.email,
        complaint.noWA,
        `"${complaint.klasifikasi}"`,
        `"${complaint.deskripsi.replace(/"/g, '""')}"`,
        complaint.status,
        `"${complaint.rtl.replace(/"/g, '""')}"`,
        complaint.tanggalSelesai ? new Date(complaint.tanggalSelesai).toLocaleDateString('id-ID') : '-'
      ].join(','))
    ].join('\n')
    
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

  const exportToExcel = (data: any[], filename: string) => {
    // Create Excel-compatible HTML table
    const headers = [
      'No',
      'Nomor Pengaduan',
      'Tanggal Pengaduan',
      'Nama Pelapor',
      'Email',
      'No WhatsApp',
      'Klasifikasi',
      'Deskripsi',
      'Status',
      'RTL',
      'Tanggal Selesai'
    ]
    
    let excelContent = `
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((complaint, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${complaint.id}</td>
              <td>${new Date(complaint.tanggal).toLocaleDateString('id-ID')}</td>
              <td>${complaint.nama}</td>
              <td>${complaint.email}</td>
              <td>${complaint.noWA}</td>
              <td>${complaint.klasifikasi}</td>
              <td>${complaint.deskripsi}</td>
              <td>${complaint.status}</td>
              <td>${complaint.rtl}</td>
              <td>${complaint.tanggalSelesai ? new Date(complaint.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
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

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(complaints, `pengaduan-${timestamp}.csv`)
    setNotification('Data berhasil diekspor ke CSV!')
    setTimeout(() => setNotification(''), 3000)
  }

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    exportToExcel(complaints, `pengaduan-${timestamp}.xls`)
    setNotification('Data berhasil diekspor ke Excel!')
    setTimeout(() => setNotification(''), 3000)
  }

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem('adminAuth')
    if (!isAuth) {
      router.push('/admin/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    router.push('/admin/login')
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

  const handleEditComplaint = (complaint: any) => {
    setSelectedComplaint({ ...complaint })
    setIsModalOpen(true)
  }

  const handleSaveChanges = () => {
    if (selectedComplaint) {
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === selectedComplaint.id ? selectedComplaint : complaint
        )
      )
      setIsModalOpen(false)
      setNotification('Perubahan berhasil disimpan!')
      setTimeout(() => setNotification(''), 3000)
    }
  }

  const handleSendNotification = () => {
    // Simulate sending notification
    setNotification('Notifikasi berhasil dikirim ke email dan WhatsApp!')
    setTimeout(() => setNotification(''), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-900">
              Admin Dashboard - PST BPS Kota Bitung
            </h1>
            <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-2">
            <Link href="/admin/dashboard" className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-md">
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/laporan" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
              <FileText className="w-5 h-5" />
              <span>Laporan</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {notification && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {notification}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-blue-900">Daftar Semua Pengaduan</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleExportCSV}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </Button>
                  <Button 
                    onClick={handleExportExcel}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Tgl Pengaduan</TableHead>
                      <TableHead>Nama Pelapor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>No WA</TableHead>
                      <TableHead>Klasifikasi</TableHead>
                      <TableHead>Status Penanganan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint, index) => (
                      <TableRow key={complaint.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(complaint.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="font-medium">{complaint.nama}</TableCell>
                        <TableCell>{complaint.email}</TableCell>
                        <TableCell>{complaint.noWA}</TableCell>
                        <TableCell>{complaint.klasifikasi}</TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleEditComplaint(complaint)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Ubah/Detail</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detail & Edit Pengaduan - {selectedComplaint?.id}</DialogTitle>
              </DialogHeader>
              
              {selectedComplaint && (
                <div className="space-y-4">
                  {/* Read-only fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nama Pelapor</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedComplaint.nama}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedComplaint.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">No. WhatsApp</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedComplaint.noWA}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tanggal Pengaduan</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {new Date(selectedComplaint.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Klasifikasi</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedComplaint.klasifikasi}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Deskripsi Pengaduan</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedComplaint.deskripsi}</p>
                  </div>

                  {/* Editable fields */}
                  <div>
                    <Label htmlFor="rtl">Rencana Tindak Lanjut (RTL)</Label>
                    <Textarea
                      id="rtl"
                      value={selectedComplaint.rtl}
                      onChange={(e) => setSelectedComplaint(prev => ({ ...prev, rtl: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status Pengaduan</Label>
                      <Select 
                        value={selectedComplaint.status} 
                        onValueChange={(value) => setSelectedComplaint(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baru">Baru</SelectItem>
                          <SelectItem value="Proses">Proses</SelectItem>
                          <SelectItem value="Selesai">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tanggalSelesai">Tanggal Penyelesaian</Label>
                      <Input
                        id="tanggalSelesai"
                        type="date"
                        value={selectedComplaint.tanggalSelesai}
                        onChange={(e) => setSelectedComplaint(prev => ({ ...prev, tanggalSelesai: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-700">
                      Simpan Perubahan
                    </Button>
                    <Button 
                      onClick={handleSendNotification} 
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Notifikasi Progress</span>
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
