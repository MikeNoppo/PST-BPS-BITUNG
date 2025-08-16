"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, Copy, Loader2 } from 'lucide-react'
import NavigationSecondary from '@/components/navigation-secondary'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Zod schema sesuai requirement user
const schema = z.object({
  namaLengkap: z.string().min(3, 'Minimal 3 karakter').max(150, 'Terlalu panjang'),
  email: z.string().email('Format email tidak valid').max(190),
  nomorTelepon: z.string().regex(/^(\+62|08)\d{7,13}$/,'Nomor harus diawali +62 atau 08 dan panjang wajar'),
  klasifikasi: z.string().min(1, 'Pilih klasifikasi'),
  deskripsi: z.string().max(1500, 'Maks 1500 karakter'), // tanpa minimal
  hp_field: z.string().optional() // honeypot
})

type FormValues = z.infer<typeof schema>

const DESKRIPSI_MAX = 1500
const LOCAL_KEY = 'draft_pengaduan_v1'

interface KlasifikasiItem { value: string; label: string }

export default function BuatPengaduan() {
  const [klasifikasiOptions, setKlasifikasiOptions] = useState<KlasifikasiItem[]>([])
  const [loadingKlasifikasi, setLoadingKlasifikasi] = useState(true)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle')
  const [serverCode, setServerCode] = useState<string>('')
  const [serverError, setServerError] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      namaLengkap: '',
      email: '',
      nomorTelepon: '',
      klasifikasi: '',
      deskripsi: '',
      hp_field: ''
    }
  })

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        form.reset({ ...form.getValues(), ...parsed })
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto save draft
  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({
          namaLengkap: values.namaLengkap,
          email: values.email,
            nomorTelepon: values.nomorTelepon,
          klasifikasi: values.klasifikasi,
          deskripsi: values.deskripsi
        }))
      } catch {}
    })
    return () => sub.unsubscribe()
  }, [form])

  // Fetch klasifikasi from API
  useEffect(() => {
    let active = true
    async function load() {
      setLoadingKlasifikasi(true)
      try {
        const res = await fetch('/api/klasifikasi')
        const data = await res.json()
        if (active && Array.isArray(data.data)) setKlasifikasiOptions(data.data)
      } catch {
        // fallback static if API error
        if (active) setKlasifikasiOptions([
          { value: 'PERSYARATAN_LAYANAN', label: 'Persyaratan Layanan' },
          { value: 'PROSEDUR_LAYANAN', label: 'Prosedur Layanan' },
          { value: 'WAKTU_PELAYANAN', label: 'Waktu Pelayanan' },
          { value: 'BIAYA_TARIF_PELAYANAN', label: 'Biaya/Tarif Pelayanan' },
          { value: 'PRODUK_PELAYANAN', label: 'Produk Pelayanan' },
          { value: 'KOMPETENSI_PELAKSANA_PELAYANAN', label: 'Kompetensi Pelaksana Pelayanan' },
          { value: 'PERILAKU_PETUGAS_PELAYANAN', label: 'Perilaku Petugas Pelayanan' },
          { value: 'SARANA_DAN_PRASARANA', label: 'Sarana dan Prasarana' },
        ])
      } finally {
        if (active) setLoadingKlasifikasi(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const deskripsiLength = form.watch('deskripsi')?.length || 0
  const progressValue = (deskripsiLength / DESKRIPSI_MAX) * 100

  const onSubmit = useCallback(async (values: FormValues) => {
    setSubmitState('submitting')
    setServerError('')
    setCopied(false)
    try {
      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        if (res.status === 429) {
          const code = err?.error
          const rateMessages: Record<string,string> = {
            RATE_LIMIT_IP_SHORT: 'Terlalu banyak percobaan dari IP Anda dalam 10 menit terakhir. Silakan coba lagi beberapa menit lagi.',
            RATE_LIMIT_IP_DAILY: 'Batas harian pengiriman dari IP ini sudah tercapai. Coba lagi besok.',
            RATE_LIMIT_EMAIL: 'Terlalu banyak pengiriman menggunakan email ini dalam 1 jam terakhir. Mohon tunggu sebelum mencoba kembali.',
            DUPLICATE_CONTENT: 'Konten pengaduan identik telah dikirim baru-baru ini. Ubah/redaksi ulang deskripsi bila ingin menambahkan detail.'
          }
            setServerError(err?.message || rateMessages[code] || 'Anda sedang dibatasi sementara. Coba lagi nanti.')
        } else if (err?.error === 'VALIDATION_ERROR') {
          setServerError('Validasi gagal, periksa kembali isian Anda.')
        } else {
          setServerError('Gagal mengirim pengaduan')
        }
        setSubmitState('error')
        return
      }
      const data = await res.json()
      setServerCode(data?.data?.code || '')
      setSubmitState('success')
      // clear draft
      localStorage.removeItem(LOCAL_KEY)
      form.reset({ namaLengkap: '', email:'', nomorTelepon:'', klasifikasi:'', deskripsi:'', hp_field:'' })
    } catch (e) {
      setServerError('Terjadi kesalahan jaringan')
      setSubmitState('error')
    }
  }, [form])

  const copyCode = () => {
    if (!serverCode) return
    navigator.clipboard.writeText(serverCode).then(() => {
      setCopied(true)
      setTimeout(()=> setCopied(false), 2000)
    })
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <NavigationSecondary />

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-green-700 mb-2">Pengaduan Berhasil Dikirim!</h2>
                  <p className="text-muted-foreground text-sm">Simpan atau salin nomor pengaduan Anda untuk pelacakan status.</p>
                </div>
                <Alert>
                  <AlertDescription className="text-center space-y-2">
                    <div className="font-semibold text-lg select-all">Nomor Pengaduan: {serverCode}</div>
                    <div className="flex justify-center">
                      <Button type="button" size="sm" variant="secondary" onClick={copyCode} className="gap-2">
                        <Copy className="w-4 h-4" /> {copied ? 'Tersalin' : 'Salin'}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={`/status?ref=${serverCode}`}> <Button className="w-full sm:w-auto">Lihat Pengaduan Saya</Button></Link>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={()=> { setSubmitState('idle'); setServerCode('') }}>Buat Pengaduan Baru</Button>
                  <Link href="/"> <Button variant="ghost" className="w-full sm:w-auto">Beranda</Button></Link>
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
                  {serverError && (
                    <Alert variant="destructive" className="animate-in fade-in">
                      <AlertDescription>{serverError}</AlertDescription>
                    </Alert>
                  )}
                  {/* Honeypot */}
                  <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...form.register('hp_field')} />
                  {/* Data Pelapor */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Data Pelapor</h3>
                    <FormField name="namaLengkap" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama sesuai KTP" autoComplete="name" {...field} />
                        </FormControl>
                        <FormDescription>Minimal 3 karakter.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="email" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="nama@contoh.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormDescription>Kami gunakan untuk notifikasi status.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="nomorTelepon" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Telepon / WhatsApp *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Contoh: 081234567890" {...field} />
                        </FormControl>
                        <FormDescription>Format: +62 atau 08 diikuti angka. Tanpa spasi / tanda.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {/* Detail Pengaduan */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Detail Pengaduan</h3>
                    <FormField name="klasifikasi" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klasifikasi Pengaduan *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loadingKlasifikasi}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingKlasifikasi ? 'Memuat...' : 'Pilih klasifikasi'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {klasifikasiOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Pilih kategori yang paling sesuai.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="deskripsi" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi Detail *</FormLabel>
                        <FormControl>
                          <Textarea rows={6} placeholder="Jelaskan secara detail pengaduan Anda..." {...field} />
                        </FormControl>
                        <div className="space-y-2">
                          <Progress value={progressValue} className={cn(progressValue > 100 && 'bg-destructive')} />
                          <div className={cn('text-xs text-right', deskripsiLength > DESKRIPSI_MAX ? 'text-red-600 font-medium':'text-muted-foreground')}>{deskripsiLength}/{DESKRIPSI_MAX}</div>
                        </div>
                        <FormDescription>Tidak ada batas minimal. Maksimal {DESKRIPSI_MAX} karakter.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60" disabled={!form.formState.isValid || submitState==='submitting'}>
                    {submitState==='submitting' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : 'Kirim Pengaduan'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
