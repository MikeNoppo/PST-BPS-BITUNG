import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Globe, ArrowUp, Clock, Lock, ShieldCheck } from 'lucide-react'

// Reusable site footer (server component)
export function Footer() {
  const year = new Date().getFullYear()
  return (
  <footer className="bg-blue-950 text-blue-100 border-t border-blue-800/40" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Informasi bagian bawah situs</h2>
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image src="/images/bps-logo.svg" alt="Logo BPS" width={46} height={46} />
            <p className="font-semibold leading-tight text-sm">
              Badan Pusat Statistik<br/>Kota Bitung
            </p>
          </div>
          <p className="text-xs leading-relaxed text-blue-200/80 max-w-xs">
            Portal layanan pengaduan PST untuk meningkatkan kualitas pelayanan statistik terpadu.
          </p>
        </div>
        {/* Navigasi */}
        <nav aria-label="Navigasi cepat" className="text-sm space-y-3">
          <p className="font-semibold text-blue-50 tracking-wide text-xs uppercase">Navigasi</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-white transition-colors" href="/">Beranda</Link></li>
            <li><Link className="hover:text-white transition-colors" href="/pengaduan">Buat Pengaduan</Link></li>
            <li><Link className="hover:text-white transition-colors" href="/status">Cek Status</Link></li>
            {/* Admin login link removed per request */}
          </ul>
        </nav>
        {/* Kontak */}
        <div className="text-sm space-y-3">
          <p className="font-semibold text-blue-50 tracking-wide text-xs uppercase">Kontak</p>
          <ul className="space-y-2 text-blue-200/90">
            <li>
              <a
                href="https://www.google.com/maps/place/Kantor+BPS+Kota+Bitung/@1.4353621,125.1167755,17z/data=!4m15!1m8!3m7!1s0x328706a9fd9b0a1d:0x9756b1684282fb67!2sJl.+Stadion+2+Saudara,+Kota+Bitung,+Sulawesi+Utara!3b1!8m2!3d1.436188!4d125.1109283!16s%2Fg%2F1hm3lggfh!3m5!1s0x328706a827fb88bb:0x164eca2877b0e4b7!8m2!3d1.4347919!4d125.1179159!16s%2Fg%2F11g81fn37w?entry=ttu&g_ep=EgoyMDI1MDgxMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white block group"
                aria-label="Buka lokasi di Google Maps"
              >
                <span className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-blue-300 group-hover:text-white transition-colors" aria-hidden="true" />
                  <span>
                    <span className="block">Jl. Stadion 2 Saudara</span>
                    <span className="block">Manembo-nembo Tengah, Kec. Matuari</span>
                    <span className="block">Kota Bitung, Sulawesi Utara</span>
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a href="tel:+62xxxxxxxxxxx" className="hover:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" aria-hidden="true" />
                <span>Telp: (xxx) xxx xxxx</span>
              </a>
            </li>
            <li>
              <a
                href="http://bitungkota.bps.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" aria-hidden="true" />
                <span>bitungkota.bps.go.id</span>
              </a>
            </li>
          </ul>
        </div>
        {/* Informasi */}
        <div className="text-sm space-y-3">
          <p className="font-semibold text-blue-50 tracking-wide text-xs uppercase">Informasi</p>
            <ul className="space-y-2 text-blue-200/90">
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-300" aria-hidden="true" /> <span>Layanan 24/7</span></li>
              <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-300" aria-hidden="true" /> <span>Data rahasia &amp; aman</span></li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-300" aria-hidden="true" /> <span>Komitmen peningkatan mutu</span></li>
            </ul>
            <div className="pt-2">
              <Link href="#top" className="inline-flex items-center gap-1 text-xs bg-blue-800/40 hover:bg-blue-700/60 px-3 py-1.5 rounded-md transition-colors group">
                <ArrowUp className="w-3.5 h-3.5 text-blue-300 group-hover:text-white transition-colors" aria-hidden="true" />
                <span>Kembali ke atas</span>
              </Link>
            </div>
        </div>
      </div>
      <div className="border-t border-blue-800/40">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-blue-300/70">
          <p>&copy; {year} BPS Kota Bitung. Semua hak dilindungi.</p>
          <p className="flex gap-3">
            <span><Link href="/" className="hover:text-white">Kebijakan Privasi</Link></span>
            <span className="hidden md:inline">&middot;</span>
            <span><Link href="/" className="hover:text-white">Syarat Penggunaan</Link></span>
          </p>
        </div>
      </div>
    </footer>
  )
}
