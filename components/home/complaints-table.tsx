"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ComplaintPublic {
  id: string
  tanggal: string // ISO date string
  klasifikasi: string
  status: string
}

interface Props {
  initialComplaints: ComplaintPublic[]
  /** Optional visual variant. 'dark' renders a translucent blue card suited for dark / hero-adjacent sections */
  variant?: 'default' | 'dark'
}

export function ComplaintsTable({ initialComplaints, variant = 'default' }: Props) {
  const [complaints, setComplaints] = useState(initialComplaints)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const isDark = variant === 'dark'

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
    <Card
      className={cn(
        isDark &&
          'bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/80 border-blue-700/40 text-blue-50 shadow-xl backdrop-blur-sm'
      )}
    >
      <CardHeader className={cn(isDark && 'pb-4')}> 
        <div className="flex items-center justify-between gap-4 flex-col md:flex-row md:items-start">
          <CardTitle className={cn('text-2xl', isDark ? 'text-white' : 'text-blue-900')}>Pengaduan Terbaru</CardTitle>
          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center space-x-2">
              <span className={cn('text-sm', isDark ? 'text-blue-200/80' : 'text-gray-600')}>Urutkan berdasarkan:</span>
              <Select value={sortOrder} onValueChange={(v) => handleSort(v as 'asc' | 'desc')}>
                <SelectTrigger className={cn('w-48', isDark && 'bg-blue-800/40 border-blue-700/60 text-blue-100 placeholder:text-blue-200 focus:ring-blue-400')}> 
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(isDark && 'bg-blue-900 text-blue-50 border-blue-700')}> 
                  <SelectItem value="desc">Tanggal Terbaru</SelectItem>
                  <SelectItem value="asc">Tanggal Terlama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={exportPublicDataToCSV}
              variant={isDark ? 'secondary' : 'outline'}
              size="sm"
              className={cn('flex items-center space-x-2', isDark && 'bg-blue-800/50 hover:bg-blue-700/70 border border-blue-700/60 text-blue-100')}
              aria-label="Export pengaduan sebagai CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className={cn(isDark && '[&_th]:text-blue-200/90 [&_td]:text-blue-100 [&_tr]:border-blue-700/40 [&_tr:hover]:bg-blue-800/40')}> 
          <TableHeader>
            <TableRow className={cn(isDark && 'hover:bg-transparent')}> 
              <TableHead>Nomor</TableHead>
              <TableHead>Tanggal Pengaduan</TableHead>
              <TableHead>Klasifikasi Pengaduan</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map(c => (
              <TableRow key={c.id} className={cn(isDark && 'hover:bg-blue-800/40 border-blue-800/50')}> 
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
