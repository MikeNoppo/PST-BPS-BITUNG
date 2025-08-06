'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, User } from 'lucide-react'
import NavigationSecondary from '@/components/navigation-secondary'

export default function BuatPengaduan() {
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    nomorTelepon: '',
    klasifikasi: '',
    deskripsi: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState('')

  const klasifikasiOptions = [
    'Persyaratan Layanan',
    'Prosedur Layanan',
    'Waktu Pelayanan',
    'Biaya/Tarif Pelayanan',
    'Produk Pelayanan',
    'Kompetensi Pelaksana Pelayanan',
    'Perilaku Petugas Pelayanan',
    'Sarana dan Prasarana'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateComplaintId = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `PGD${timestamp}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate form submission
    const newComplaintId = generateComplaintId()
    setComplaintId(newComplaintId)
    setIsSubmitted(true)
    
    // Reset form
    setFormData({
      namaLengkap: '',
      email: '',
      nomorTelepon: '',
      klasifikasi: '',
      deskripsi: ''
    })
  }

  const isFormValid = formData.namaLengkap && formData.email && formData.nomorTelepon && 
                     formData.klasifikasi && formData.deskripsi

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <NavigationSecondary />

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-4">
                  Pengaduan Berhasil Dikirim!
                </h2>
                <Alert className="mb-6">
                  <AlertDescription className="text-center">
                    <strong>Nomor Pengaduan Anda: {complaintId}</strong>
                    <br />
                    Mohon simpan nomor ini untuk melacak status pengaduan Anda.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/status">
                    <Button className="w-full sm:w-auto">
                      Cek Status Pengaduan
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Kembali ke Beranda
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <NavigationSecondary />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Formulir Pengaduan Layanan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Data Pelapor */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Data Pelapor</h3>
                  
                  <div>
                    <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                    <Input
                      id="namaLengkap"
                      type="text"
                      value={formData.namaLengkap}
                      onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Alamat Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nomorTelepon">Nomor Telepon/WhatsApp *</Label>
                    <Input
                      id="nomorTelepon"
                      type="tel"
                      value={formData.nomorTelepon}
                      onChange={(e) => handleInputChange('nomorTelepon', e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                </div>

                {/* Detail Pengaduan */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Detail Pengaduan</h3>
                  
                  <div>
                    <Label htmlFor="klasifikasi">Klasifikasi Pengaduan *</Label>
                    <Select value={formData.klasifikasi} onValueChange={(value) => handleInputChange('klasifikasi', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih klasifikasi pengaduan" />
                      </SelectTrigger>
                      <SelectContent>
                        {klasifikasiOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deskripsi">Deskripsi Detail Isi Pengaduan *</Label>
                    <Textarea
                      id="deskripsi"
                      value={formData.deskripsi}
                      onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                      required
                      rows={6}
                      className="mt-1"
                      placeholder="Jelaskan secara detail pengaduan Anda..."
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!isFormValid}
                >
                  Kirim Pengaduan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
