'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/pengaduan', label: 'Pengaduan', icon: ListTodo },
  { href: '/admin/laporan', label: 'Laporan', icon: FileText }
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white/90 backdrop-blur border-r min-h-screen hidden md:block">
      <div className="px-4 py-5 font-semibold text-blue-900">Admin PST</div>
      <nav className="px-2 space-y-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
