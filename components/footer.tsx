import Link from 'next/link'
import Image from 'next/image'

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
            <li><Link className="hover:text-white transition-colors" href="/admin/login">Login Admin</Link></li>
          </ul>
        </nav>
        {/* Kontak */}
        <div className="text-sm space-y-3">
          <p className="font-semibold text-blue-50 tracking-wide text-xs uppercase">Kontak</p>
          <ul className="space-y-2 text-blue-200/90">
            <li><span className="block">Jl. Sam Ratulangi No. 42</span><span>Bitung, Sulawesi Utara</span></li>
            <li><a href="tel:+62xxxxxxxxxxx" className="hover:text-white">Telp: (xxx) xxx xxxx</a></li>
            <li><a href="mailto:bitungkota@bps.go.id" className="hover:text-white">bitungkota@bps.go.id</a></li>
          </ul>
        </div>
        {/* Informasi */}
        <div className="text-sm space-y-3">
          <p className="font-semibold text-blue-50 tracking-wide text-xs uppercase">Informasi</p>
            <ul className="space-y-2 text-blue-200/90">
              <li>Layanan 24/7</li>
              <li>Data rahasia &amp; aman</li>
              <li>Komitmen peningkatan mutu</li>
            </ul>
            <div className="pt-2">
              <Link href="#top" className="inline-block text-xs bg-blue-800/40 hover:bg-blue-700/60 px-3 py-1.5 rounded-md transition-colors">Kembali ke atas</Link>
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
