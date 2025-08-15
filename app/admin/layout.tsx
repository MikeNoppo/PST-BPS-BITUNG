'use client'

import { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const loading = status === 'loading'
  const pathname = usePathname()

  // Don't wrap the login page with the admin chrome
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminTopbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-md border" />
                ))}
              </div>
              <div className="h-72 bg-white rounded-md border" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
