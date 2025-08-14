"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface ComplaintPublic {
  id: string
  tanggal: string // ISO date string
  klasifikasi: string
  status: string
}

interface Props {
  initialComplaints: ComplaintPublic[]
}

export function ComplaintsTable({ initialComplaints }: Props) {
  const [complaints, setComplaints] = useState(initialComplaints)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (order: 'asc' | 'desc') => {
    setSortOrder(order)
    const sorted = [...complaints].sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime()
      const dateB = new Date(b.tanggal).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
    setComplaints(sorted)
  }

  const exportPublicDataToCSV = () => {
    const headers = ['Nomor', 'Tanggal Pengaduan', 'Klasifikasi Pengaduan', 'Status']
    const csvContent = [
      headers.join(','),
      ...complaints.map(c => [
        c.id,
        new Date(c.tanggal).toLocaleDateString('id-ID'),
        `"${c.klasifikasi}"`,
        c.status
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-blue-900">Pengaduan Terbaru</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Urutkan berdasarkan:</span>
              <Select value={sortOrder} onValueChange={(v) => handleSort(v as 'asc' | 'desc')}>
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
              aria-label="Export pengaduan sebagai CSV"
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
            {complaints.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.id}</TableCell>
                <TableCell>{new Date(c.tanggal).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{c.klasifikasi}</TableCell>
                <TableCell>{getStatusBadge(c.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
