'use client'

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
