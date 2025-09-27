'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Home, FileText, Search } from 'lucide-react'
import Image from 'next/image'

const navigationItems = [
  {
    name: 'Beranda',
    href: '/',
    icon: Home
  },
  {
    name: 'Buat Pengaduan',
    href: '/pengaduan',
    icon: FileText
  },
  {
    name: 'Cek Status',
    href: '/status',
    icon: Search
  }
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header
      className={
        `w-full z-50 ${
          isHome
            ? 'absolute top-0 left-0 right-0 bg-transparent border-transparent'
            : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 border-b border-blue-600/30'
        }`
      }
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* BPS Logo */}
              <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                <Image 
                  src="/images/bps-logo.svg" 
                  alt="Logo BPS" 
                  width={50} 
                  height={50} 
                  className="w-100 h-100 lg:w-15 lg:h-15 object-contain"
                />
              </div>
              
              {/* Brand Text */}
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-white leading-tight">
                  Layanan Pengaduan
                </h1>
                <p className="text-xs lg:text-sm text-blue-200 font-medium">
                  PST BPS Kota Bitung
                </p>
              </div>
              
              {/* Mobile Brand */}
              <div className="sm:hidden">
                <h1 className="text-base font-bold text-white">
                  BPS Bitung
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 group ${
                    active
                      ? 'text-white bg-white/20 backdrop-blur-sm border border-white/30'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    active ? 'text-white' : 'text-blue-200 group-hover:text-white'
                  }`} />
                  <span>{item.name}</span>
                  
                  {/* Active Indicator */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 hover:bg-white/10 text-white"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-80 p-0 bg-gradient-to-b from-blue-900 to-blue-800 border-l border-blue-600/30">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b border-blue-600/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <Image 
                          src="/images/bps-logo.svg" 
                          alt="Logo BPS" 
                          width={32} 
                          height={32} 
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div>
                        <h2 className="font-bold text-white">BPS Kota Bitung</h2>
                        <p className="text-sm text-blue-200">Layanan Pengaduan</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 p-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                              active
                                ? 'text-white bg-white/20 backdrop-blur-sm border-l-4 border-white'
                                : 'text-blue-100 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${
                              active ? 'text-white' : 'text-blue-200'
                            }`} />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                  </nav>

                  {/* Mobile Footer */}
                  <div className="p-6 border-t border-blue-600/30 bg-blue-900/50">
                    <p className="text-xs text-blue-200 text-center">
                      © 2024 BPS Kota Bitung
                      <br />
                      Layanan Pengaduan Online
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
