"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search, AlertCircle, RefreshCcw } from 'lucide-react'
import NavigationSecondary from '@/components/navigation-secondary'
import { cn } from '@/lib/utils'

export default function CekStatus() {
  const params = useSearchParams()
  const initialRef = params.get('ref') || ''
  const [complaintId, setComplaintId] = useState(initialRef)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!initialRef)

  const fetchStatus = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setIsLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`/api/pengaduan/${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Nomor pengaduan tidak ditemukan.')
        } else {
          setError('Gagal memuat status pengaduan.')
        }
      } else {
        const json = await res.json()
        setData(json.data)
      }
    } catch {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setIsLoading(false)
      setHasSearched(true)
    }
  }, [])

  useEffect(() => {
    if (initialRef) fetchStatus(initialRef)
  }, [initialRef, fetchStatus])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStatus(complaintId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BARU':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Baru</Badge>
      case 'PROSES':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Proses</Badge>
      case 'SELESAI':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Component */}
      <NavigationSecondary />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 text-center">Lacak Status Pengaduan Anda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="complaintId">Masukkan Nomor Pengaduan Anda</Label>
                  <Input
                    id="complaintId"
                    type="text"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
                    placeholder="Contoh: PGD250801ABC"
                    className="mt-1"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading || !complaintId.trim()}>
                    {isLoading ? 'Memuat...' : (
                      <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Cek Status</span>
                    )}
                  </Button>
                  {hasSearched && (
                    <Button type="button" variant="outline" onClick={()=> fetchStatus(complaintId)} disabled={isLoading || !complaintId.trim()} className="gap-2">
                      <RefreshCcw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                      Refresh
                    </Button>
                  )}
                </div>
              </form>

              {hasSearched && (
                <div className="mt-8 min-h-[120px]">
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}
                  {!error && isLoading && (
                    <p className="text-sm text-muted-foreground">Memuat status...</p>
                  )}
                  {!error && !isLoading && data && (
                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Detail Pengaduan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Nomor Pengaduan</Label>
                            <p className="text-lg font-semibold select-all">{data.code}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Tanggal Lapor</Label>
                            <p className="text-lg">{new Date(data.createdAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status Terakhir</Label>
                          <div className="mt-1">{getStatusBadge(data.status)}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Keterangan / Rencana Tindak Lanjut</Label>
                          <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{data.keterangan}</p>
                        </div>
                        {data.latestUpdate && (
                          <div className="text-xs text-muted-foreground">
                            Pembaruan terakhir: {new Date(data.latestUpdate.createdAt).toLocaleString('id-ID')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {!error && !isLoading && !data && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">Masukkan nomor pengaduan untuk melihat status.</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
