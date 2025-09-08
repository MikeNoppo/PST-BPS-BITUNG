"use client"

import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared month list for report pages
export const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
]

export const exportToCSV = (data: any[], headers: string[], filename: string, dataMapper: (item: any, index: number) => any[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map((item, index) => 
      dataMapper(item, index).map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(',')
    )
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToExcel = (data: any[], headers: string[], filename: string, dataMapper: (item: any, index: number) => any[]) => {
  let excelContent = `
    <table border="1">
      <thead>
        <tr style="background-color: #3b82f6; color: white; font-weight: bold;">
          ${headers.map(header => `<th style="padding: 8px; text-align: center;">${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr>
            ${dataMapper(item, index).map(field => `<td style="padding: 8px;">${field}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
  
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const formatDateForExport = (dateString: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-'
}

export const escapeCSVField = (field: string) => {
  if (typeof field !== 'string') return field
  return field.includes(',') || field.includes('"') || field.includes('\n') 
    ? `"${field.replace(/"/g, '""')}"` 
    : field
}

// Generic dropdown component for CSV / Excel export actions
export function ExportDropdown({
  onCSV,
  onExcel,
  onSheets,
  size = 'sm',
  label = 'Export',
  count,
  largeThreshold = 5000,
  disabled = false
}: {
  onCSV?: () => Promise<void> | void
  onExcel?: () => Promise<void> | void
  onSheets?: () => Promise<void> | void
  size?: 'sm' | 'default'
  label?: string
  count?: number
  largeThreshold?: number
  disabled?: boolean
}) {
  const [loading, setLoading] = useState<'csv' | 'excel' | 'sheets' | null>(null)
  const isLarge = typeof count === 'number' && count >= largeThreshold

  const wrap = async (type: 'csv' | 'excel' | 'sheets', fn: () => Promise<void> | void) => {
    try {
      setLoading(type)
      await fn()
    } finally {
      setLoading((l: 'csv' | 'excel' | 'sheets' | null) => (l === type ? null : l))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="gap-2"
          disabled={!!loading || disabled}
          aria-disabled={!!loading || disabled}
          aria-busy={!!loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? 'Memproses...' : label}
          {isLarge && !loading && <span className="text-[10px] font-medium text-orange-600 border border-orange-200 bg-orange-50 px-1 py-0.5 rounded">Besar</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isLarge && (
          <div className="px-2 py-1.5 text-[11px] text-orange-700 bg-orange-50 rounded-sm mb-1 leading-snug">
            Dataset besar, mungkin butuh beberapa detik.
          </div>
        )}
        {onCSV && (
          <DropdownMenuItem
            disabled={!!loading || disabled}
            onClick={() => wrap('csv', () => onCSV())}
            className="cursor-pointer"
          >
            {loading === 'csv' && <Loader2 className="w-3 h-3 animate-spin" />} CSV
          </DropdownMenuItem>
        )}
        {onExcel && (
          <DropdownMenuItem
            disabled={!!loading || disabled}
            onClick={() => wrap('excel', () => onExcel())}
            className="cursor-pointer"
          >
            {loading === 'excel' && <Loader2 className="w-3 h-3 animate-spin" />} Excel
          </DropdownMenuItem>
        )}
        {onSheets && (
          <DropdownMenuItem
            disabled={!!loading || disabled}
            onClick={() => wrap('sheets', () => onSheets())}
            className="cursor-pointer"
          >
            {loading === 'sheets' && <Loader2 className="w-3 h-3 animate-spin" />}
            <FileSpreadsheet className="w-3 h-3 mr-1" /> Sheets
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
