'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AdminSidebar } from './sidebar'

export function AdminTopbar() {
  const { status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-blue-800/40 bg-blue-950/60 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14 text-foreground">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-gray-50"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-semibold text-blue-100 tracking-wide">Admin PST BPS Kota Bitung</h1>
          </div>
          {status === 'authenticated' && (
            <Button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              variant="soft"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-blue-950 shadow-lg border-r border-blue-800/40 text-blue-100">
            <div className="flex justify-between items-center px-4 py-3 border-b border-blue-800/40">
              <span className="font-semibold">Navigasi</span>
              <button
                className="text-sm text-blue-300 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >Tutup</button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}
    </>
  )
}
