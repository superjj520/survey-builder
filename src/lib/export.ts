import { SurveyField, SurveyResponse } from './types'

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return value.join('; ')
  return String(value)
}

export function exportToCSV(fields: SurveyField[], responses: SurveyResponse[]): string {
  const headers = ['提交时间', ...fields.map((f) => f.label)]
  const rows = responses.map((response) => {
    const row = [response.submitted_at]
    for (const field of fields) {
      row.push(formatValue(response.answers[field.id]))
    }
    return row
  })

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  return '\uFEFF' + csvContent // BOM for Excel compatibility
}

export async function exportToExcel(fields: SurveyField[], responses: SurveyResponse[], title: string) {
  const XLSX = await import('xlsx')
  const headers = ['提交时间', ...fields.map((f) => f.label)]
  const rows = responses.map((response) => {
    const row: string[] = [new Date(response.submitted_at).toLocaleString()]
    for (const field of fields) {
      row.push(formatValue(response.answers[field.id]))
    }
    return row
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Auto column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => (r[i] || '').length))
    return { wch: Math.min(maxLen + 2, 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '回复数据')
  XLSX.writeFile(wb, `${title}-responses.xlsx`)
}
