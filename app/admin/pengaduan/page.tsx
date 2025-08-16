'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Edit, Send, Download, Search, CheckCircle } from 'lucide-react'
import { exportToCSV, exportToExcel, formatDateForExport, ExportDropdown } from '@/components/export-utils'

type ComplaintRow = {
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

export default function PengaduanPage() {
  useSession()
  const [items, setItems] = useState<ComplaintRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 8
  const [loading, setLoading] = useState(false)
  // Fetch complaints from API
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/pengaduan?admin=1&limit=${limit}&page=${page}`)
        const json = await res.json()
        if (!cancelled && json?.data) {
          setItems(json.data)
          setTotal(json.total || json.data.length)
        }
      } catch (e) {
        console.error('Load complaints failed', e)
      } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [page])
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [notif, setNotif] = useState('')
  const [q, setQ] = useState('')
  // Use undefined sentinel via empty string mapping for 'all'
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [klasifikasiFilter, setKlasifikasiFilter] = useState<string>('all')

  const filtered = items.filter(c => {
    const matchQ = q ? [c.id, c.nama, c.email].some(v => v.toLowerCase().includes(q.toLowerCase())) : true
    const matchStatus = statusFilter === 'all' ? true : c.status === statusFilter
    const matchKlas = klasifikasiFilter === 'all' ? true : c.klasifikasi === klasifikasiFilter
    return matchQ && matchStatus && matchKlas
  })

  const headers = ['No', 'Nomor Pengaduan', 'Tanggal', 'Nama', 'Email', 'No WA', 'Klasifikasi', 'Deskripsi', 'Status', 'RTL', 'Tanggal Selesai']

  const handleExportCSV = () => {
    const date = new Date().toISOString().split('T')[0]
    exportToCSV(filtered, headers, `pengaduan-${date}.csv`, (c, i) => [
      i + 1,
      c.id,
      formatDateForExport(c.tanggal),
      c.nama,
      c.email,
      c.noWA,
      c.klasifikasi,
      c.deskripsi,
      c.status,
      c.rtl,
      formatDateForExport(c.tanggalSelesai)
    ])
    toast('Data diekspor (CSV)')
  }

  const handleExportExcel = () => {
    const date = new Date().toISOString().split('T')[0]
    exportToExcel(filtered, headers, `pengaduan-${date}.xls`, (c, i) => [
      i + 1,
      c.id,
      formatDateForExport(c.tanggal),
      c.nama,
      c.email,
      c.noWA,
      c.klasifikasi,
      c.deskripsi,
      c.status,
      c.rtl,
      formatDateForExport(c.tanggalSelesai)
    ])
    toast('Data diekspor (Excel)')
  }

  const toast = (msg: string) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 2800)
  }

  const save = async () => {
    if (!selected) return
    try {
      const payload = {
        rtl: selected.rtl,
        status: selected.status === 'Baru' ? 'BARU' : selected.status === 'Proses' ? 'PROSES' : selected.status === 'Selesai' ? 'SELESAI' : undefined,
        tanggalSelesai: selected.tanggalSelesai || undefined
      }
      const res = await fetch(`/api/pengaduan/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Gagal menyimpan')
      const json = await res.json()
      setItems(prev => prev.map(p => p.id === selected.id ? { ...p, rtl: json.data.rtl, status: selected.status, tanggalSelesai: selected.tanggalSelesai } : p))
      setOpen(false)
      toast('Perubahan disimpan')
    } catch (e) {
      toast('Gagal menyimpan')
    }
  }

  const sendProgress = () => {
    toast('Notifikasi progress terkirim')
  }

  const badge = (s: string) => {
    const base = 'px-2 py-0.5 rounded text-xs font-medium border'
    switch (s) {
      case 'Baru': return <span className={`${base} bg-blue-800/40 border-blue-600/40 text-blue-100`}>Baru</span>
      case 'Proses': return <span className={`${base} bg-amber-800/30 border-amber-500/40 text-amber-200`}>Proses</span>
      case 'Selesai': return <span className={`${base} bg-emerald-800/30 border-emerald-600/40 text-emerald-200`}>Selesai</span>
      default: return <span className={`${base} bg-blue-900/30 border-blue-700/40 text-blue-200`}>{s}</span>
    }
  }

  return (
    <div className="space-y-6">
      {notif && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{notif}</AlertDescription>
        </Alert>
      )}
      <Card className="bg-blue-900/40 border-blue-700/40 backdrop-blur supports-[backdrop-filter]:bg-blue-900/30">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl text-blue-100">Daftar Semua Pengaduan</CardTitle>
            <ExportDropdown onCSV={handleExportCSV} onExcel={handleExportExcel} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-blue-300/60" />
              <Input placeholder="Cari ID / Nama / Email" className="pl-8 bg-blue-950/40 border-blue-700/40 placeholder:text-blue-300/40 text-blue-50" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
              <SelectTrigger className="bg-blue-950/40 border-blue-700/40 text-blue-50"><SelectValue placeholder="Filter Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Baru">Baru</SelectItem>
                <SelectItem value="Proses">Proses</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={klasifikasiFilter} onValueChange={v => setKlasifikasiFilter(v)}>
              <SelectTrigger className="bg-blue-950/40 border-blue-700/40 text-blue-50"><SelectValue placeholder="Filter Klasifikasi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Klasifikasi</SelectItem>
                {[...new Set(items.map(i => i.klasifikasi))].map(k => (
                  <SelectItem value={k} key={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-blue-800/40">
            <Table>
              <TableHeader className="bg-blue-900/60 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-blue-100">No.</TableHead>
                  <TableHead className="text-blue-100">Tgl</TableHead>
                  <TableHead className="text-blue-100">Nama</TableHead>
                  <TableHead className="text-blue-100">Email</TableHead>
                  <TableHead className="text-blue-100">No WA</TableHead>
                  <TableHead className="text-blue-100">Klasifikasi</TableHead>
                  <TableHead className="text-blue-100">Status</TableHead>
                  <TableHead className="text-blue-100">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-blue-200">Memuat...</TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-blue-200">Tidak ada data</TableCell>
                  </TableRow>
                )}
                {filtered.map((c, i) => (
                  <TableRow key={c.id} className={i % 2 ? 'bg-blue-900/30' : 'bg-blue-900/10'}>
                    <TableCell className="text-blue-50">{(page - 1) * limit + i + 1}</TableCell>
                    <TableCell className="text-blue-50">{formatDateForExport(c.tanggal)}</TableCell>
                    <TableCell className="font-medium text-blue-50">{c.nama}</TableCell>
                    <TableCell className="text-blue-100/90">{c.email}</TableCell>
                    <TableCell className="text-blue-100/90">{c.noWA}</TableCell>
                    <TableCell className="text-blue-100/90">{c.klasifikasi}</TableCell>
                    <TableCell>{badge(c.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="soft" className="gap-1" onClick={() => { setSelected({ ...c }); setOpen(true) }}>
                        <Edit className="w-3 h-3" />Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-4">
        <Button size="sm" variant="outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
        <span className="text-xs text-blue-200">Hal {page} / {Math.max(1, Math.ceil(total/limit))}</span>
        <Button size="sm" variant="outline" disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)}>Next</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Adjusted dialog styling for better contrast (previously white background with very light text) */}
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-blue-950/90 border border-blue-800/60 backdrop-blur-md text-blue-50">
          <DialogHeader>
            <DialogTitle className="text-blue-50">Detail Pengaduan - {selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-semibold text-blue-200 mb-2">Informasi Pelapor</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-blue-300">Nama</span><span className="font-medium text-blue-50">{selected.nama}</span></div>
                  <div><span className="block text-blue-300">Email</span><span className="text-blue-50">{selected.email}</span></div>
                  <div><span className="block text-blue-300">No WA</span><span className="text-blue-50">{selected.noWA}</span></div>
                  <div><span className="block text-blue-300">Tanggal</span><span className="text-blue-50">{formatDateForExport(selected.tanggal)}</span></div>
                </div>
              </section>
              <section>
                <h4 className="text-sm font-semibold text-blue-200 mb-2">Detail Pengaduan</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="block text-blue-300">Klasifikasi</span><span className="text-blue-50">{selected.klasifikasi}</span></div>
                  <div>
                    <span className="block text-blue-300 mb-1">Deskripsi</span>
                    <p className="bg-blue-900/40 border border-blue-800/40 p-3 rounded text-[13px] leading-relaxed whitespace-pre-wrap text-blue-50">{selected.deskripsi}</p>
                  </div>
                </div>
              </section>
              <section className="space-y-4">
                <div>
                  <Label htmlFor="rtl" className="text-blue-200">Rencana Tindak Lanjut (RTL)</Label>
                  <Textarea id="rtl" rows={3} value={selected.rtl} onChange={e => setSelected((p: any) => ({ ...p, rtl: e.target.value }))} className="mt-1 bg-blue-950/40 border-blue-800/40 text-blue-50 placeholder:text-blue-300/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-200">Status</Label>
                    <Select value={selected.status} onValueChange={v => setSelected((p: any) => ({ ...p, status: v }))}>
                      <SelectTrigger className="mt-1 bg-blue-950/40 border-blue-800/40 text-blue-50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baru">Baru</SelectItem>
                        <SelectItem value="Proses">Proses</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="selesai" className="text-blue-200">Tanggal Selesai</Label>
                    <Input id="selesai" type="date" value={selected.tanggalSelesai} onChange={e => setSelected((p: any) => ({ ...p, tanggalSelesai: e.target.value }))} className="mt-1 bg-blue-950/40 border-blue-800/40 text-blue-50 placeholder:text-blue-300/40" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={save} className="bg-blue-600 hover:bg-blue-500">Simpan</Button>
                  <Button variant="soft" onClick={sendProgress} className="gap-2"><Send className="w-4 h-4" />Notifikasi</Button>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
