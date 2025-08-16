'use client'

import { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const loading = status === 'loading'
  const pathname = usePathname()

  // Don't wrap the login page with the admin chrome
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="admin-theme min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-foreground">
      <AdminTopbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-blue-800/40 rounded" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-md border border-blue-800/40 bg-blue-900/40" />
                ))}
              </div>
              <div className="h-72 rounded-md border border-blue-800/40 bg-blue-900/40" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
  <Toaster />
    </div>
  )
}
