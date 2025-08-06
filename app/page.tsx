'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, FileText, Search, Download, CheckCircle } from 'lucide-react'
import Navigation from '@/components/navigation'

// Mock data for complaints
const mockComplaints = [
  {
    id: 'PGD001',
    tanggal: '2024-01-15',
    klasifikasi: 'Prosedur Layanan',
    status: 'Selesai'
  },
  {
    id: 'PGD002',
    tanggal: '2024-01-14',
    klasifikasi: 'Waktu Pelayanan',
    status: 'Proses'
  },
  {
    id: 'PGD003',
    tanggal: '2024-01-13',
    klasifikasi: 'Perilaku Petugas Pelayanan',
    status: 'Baru'
  },
  {
    id: 'PGD004',
    tanggal: '2024-01-12',
    klasifikasi: 'Sarana dan Prasarana',
    status: 'Selesai'
  },
  {
    id: 'PGD005',
    tanggal: '2024-01-11',
    klasifikasi: 'Kompetensi Pelaksana Pelayanan',
    status: 'Proses'
  }
]

export default function Homepage() {
  const [complaints, setComplaints] = useState(mockComplaints)
  const [sortOrder, setSortOrder] = useState('desc')

  const exportPublicDataToCSV = () => {
    const headers = ['Nomor', 'Tanggal Pengaduan', 'Klasifikasi Pengaduan', 'Status']
    
    const csvContent = [
      headers.join(','),
      ...complaints.map((complaint) => [
        complaint.id,
        new Date(complaint.tanggal).toLocaleDateString('id-ID'),
        `"${complaint.klasifikasi}"`,
        complaint.status
      ].join(','))
    ].join('\n')
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `pengaduan-publik-${timestamp}.csv`
    
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

  const handleSort = (order: string) => {
    setSortOrder(order)
    const sorted = [...complaints].sort((a, b) => {
      const dateA = new Date(a.tanggal)
      const dateB = new Date(b.tanggal)
      return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })
    setComplaints(sorted)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation - Non-sticky */}
      <Navigation />

      {/* Hero Section with Office Background */}
      <section className="relative min-h-[600px] lg:min-h-[700px] text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/bps-office.png')`,
            backgroundPosition: 'right center'
          }}
        />
        
        {/* Gradient Overlay - Strong blue on left, fading to transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800/95 via-blue-800/80 via-blue-700/60 via-blue-600/40 to-blue-500/20"></div>
        
        {/* Additional overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 via-blue-700/50 via-blue-600/30 to-transparent"></div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24 min-h-[600px] lg:min-h-[700px] flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left Content */}
            <div className="space-y-8 z-10">

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  <span className="block text-white drop-shadow-lg">Layanan</span>
                  <span className="block text-blue-100 drop-shadow-lg">Pengaduan Online</span>
                  <span className="block text-2xl lg:text-3xl xl:text-4xl font-semibold text-blue-200 mt-2 drop-shadow-lg">
                    BPS Kota Bitung
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl drop-shadow-md">
                  Sampaikan masukan, keluhan, atau apresiasi Anda terhadap Pelayanan Statistik Terpadu (PST) 
                  BPS Kota Bitung untuk membantu kami menjadi lebih baik.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pengaduan">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Buat Pengaduan Sekarang
                  </Button>
                </Link>
                <Link href="/status">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-blue-900 font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Cek Status Pengaduan
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm text-blue-100">Layanan Online</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-sm text-blue-100">Gratis</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="text-2xl font-bold text-white">Fast</div>
                  <div className="text-sm text-blue-100">Respon Cepat</div>
                </div>
              </div>
            </div>

            {/* Right side - Space for office building to show through gradient */}
            <div className="relative lg:block hidden">
              {/* This space intentionally left for the office building background to show through */}
              <div className="h-96 flex items-center justify-center">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complaints List Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-blue-900">Pengaduan Terbaru</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Urutkan berdasarkan:</span>
                    <Select value={sortOrder} onValueChange={handleSort}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Tanggal Terbaru</SelectItem>
                        <SelectItem value="asc">Tanggal Terlama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={exportPublicDataToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Tanggal Pengaduan</TableHead>
                    <TableHead>Klasifikasi Pengaduan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint, index) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.id}</TableCell>
                      <TableCell>{new Date(complaint.tanggal).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{complaint.klasifikasi}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
