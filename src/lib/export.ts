import { SurveyField, SurveyResponse } from './types'

export function exportToCSV(fields: SurveyField[], responses: SurveyResponse[]): string {
  const headers = ['提交时间', ...fields.map((f) => f.label)]
  const rows = responses.map((response) => {
    const row = [response.submitted_at]
    for (const field of fields) {
      const value = response.answers[field.id]
      if (value === undefined || value === null) {
        row.push('')
      } else if (Array.isArray(value)) {
        row.push(value.join('; '))
      } else {
        row.push(String(value))
      }
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
