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
    <aside className="w-60 hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border/60 min-h-screen">
      <div className="px-4 py-5 font-semibold text-blue-100 tracking-wide">Admin PST</div>
      <nav className="px-2 space-y-1 flex-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border border-transparent',
                active
                  ? 'bg-sidebar-primary/20 text-white border-sidebar-primary/40 shadow-inner'
                  : 'text-blue-200 hover:bg-sidebar-accent/60 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 text-[10px] text-blue-400/60">© {new Date().getFullYear()} PST BPS Bitung</div>
    </aside>
  )
}
