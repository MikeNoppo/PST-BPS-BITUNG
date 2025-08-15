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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-gray-50"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-semibold text-blue-900">Admin PST BPS Kota Bitung</h1>
          </div>
          {status === 'authenticated' && (
            <Button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              variant="outline"
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
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-white shadow-lg">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <span className="font-semibold text-blue-900">Navigasi</span>
              <button
                className="text-sm text-gray-500 hover:text-gray-800"
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
