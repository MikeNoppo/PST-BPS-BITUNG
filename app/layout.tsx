import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Layanan Pengaduan PST BPS Kota Bitung',
  description: 'Sistem Pengaduan Online untuk Pelayanan Statistik Terpadu BPS Kota Bitung',
  icons: {
    icon: '/images/bps-logo.svg',
    shortcut: '/images/bps-logo.svg',
    apple: '/images/bps-logo.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
