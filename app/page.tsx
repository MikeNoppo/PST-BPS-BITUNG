import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Search } from 'lucide-react'
import Navigation from '@/components/navigation'
import { ComplaintsTable, type ComplaintPublic } from '@/components/home/complaints-table'

// In real scenario you would fetch from DB here (Server Component)
const mockComplaints: ComplaintPublic[] = [
  { id: 'PGD001', tanggal: '2024-01-15', klasifikasi: 'Prosedur Layanan', status: 'Selesai' },
  { id: 'PGD002', tanggal: '2024-01-14', klasifikasi: 'Waktu Pelayanan', status: 'Proses' },
  { id: 'PGD003', tanggal: '2024-01-13', klasifikasi: 'Perilaku Petugas Pelayanan', status: 'Baru' },
  { id: 'PGD004', tanggal: '2024-01-12', klasifikasi: 'Sarana dan Prasarana', status: 'Selesai' },
  { id: 'PGD005', tanggal: '2024-01-11', klasifikasi: 'Kompetensi Pelaksana Pelayanan', status: 'Proses' },
]

export default function Homepage() {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation - Non-sticky */}
      <Navigation />

  {/* Hero Section with Office Background */}
  <section className="relative min-h-screen text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/bps-office.jpg')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        
  {/* Gradient Overlay - Smooth transition from blue to transparent */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-700/60 to-blue-900/10"></div>
        
  {/* Additional overlay for better text readability on left side */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-blue-600/30 to-blue-900/5"></div>

  <div className="relative container mx-auto px-4 py-16 lg:py-24 min-h-full flex items-center justify-start">
          {/* Centered Content */}
          <div className="w-full max-w-4xl flex flex-col items-start text-left z-10 translate-y-16 lg:translate-y-28 space-y-8">

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
        </div>
      </section>

      {/* Complaints List Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <ComplaintsTable initialComplaints={mockComplaints} />
        </div>
      </section>
    </div>
  )
}
