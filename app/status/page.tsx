'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search, User, AlertCircle } from 'lucide-react'
import NavigationSecondary from '@/components/navigation-secondary'

// Mock data for complaint details
const mockComplaintDetails = {
  'PGD001': {
    id: 'PGD001',
    tanggalLapor: '2024-01-15',
    status: 'Selesai',
    keterangan: 'Pengaduan telah ditindaklanjuti dan diselesaikan. Prosedur layanan telah diperbaiki sesuai masukan Anda.'
  },
  'PGD002': {
    id: 'PGD002',
    tanggalLapor: '2024-01-14',
    status: 'Proses',
    keterangan: 'Pengaduan sedang dalam proses penanganan. Tim kami sedang melakukan evaluasi terhadap waktu pelayanan.'
  },
  'PGD003': {
    id: 'PGD003',
    tanggalLapor: '2024-01-13',
    status: 'Baru',
    keterangan: 'Pengaduan telah diterima dan akan segera ditindaklanjuti oleh tim terkait.'
  }
}

export default function CekStatus() {
  const [complaintId, setComplaintId] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [isSearched, setIsSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSearched(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const result = mockComplaintDetails[complaintId as keyof typeof mockComplaintDetails]
    setSearchResult(result || null)
    setIsLoading(false)
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
              <CardTitle className="text-2xl text-blue-900 text-center">
                Lacak Status Pengaduan Anda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="complaintId">Masukkan Nomor Pengaduan Anda</Label>
                  <Input
                    id="complaintId"
                    type="text"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    placeholder="Contoh: PGD001"
                    className="mt-1"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  disabled={isLoading || !complaintId.trim()}
                >
                  {isLoading ? (
                    <span>Mencari...</span>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Cek Status</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Search Results */}
              {isSearched && (
                <div className="mt-8">
                  {searchResult ? (
                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Detail Pengaduan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Nomor Pengaduan</Label>
                            <p className="text-lg font-semibold">{searchResult.id}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Tanggal Lapor</Label>
                            <p className="text-lg">{new Date(searchResult.tanggalLapor).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Status Terakhir</Label>
                          <div className="mt-1">
                            {getStatusBadge(searchResult.status)}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Keterangan / Rencana Tindak Lanjut</Label>
                          <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-md">
                            {searchResult.keterangan}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Nomor pengaduan tidak ditemukan. Pastikan Anda memasukkan nomor yang benar.
                        <br />
                        <span className="text-sm">Contoh nomor pengaduan yang valid: PGD001, PGD002, PGD003</span>
                      </AlertDescription>
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
