'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Survey, SurveyResponse, SurveyField, FIELD_TYPE_LABELS } from '@/lib/types'
import { exportToCSV } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ResultsPage() {
  const params = useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'stats' | 'list'>('stats')

  useEffect(() => {
    Promise.all([
      fetch(`/api/surveys/${params.id}`).then((r) => r.json()),
      fetch(`/api/surveys/${params.id}/responses`).then((r) => r.json()),
    ]).then(([surveyData, responsesData]) => {
      setSurvey(surveyData)
      setResponses(responsesData)
      setLoading(false)
    })
  }, [params.id])

  const handleExport = () => {
    if (!survey) return
    const csv = exportToCSV(survey.fields, responses)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${survey.title}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>
  if (!survey) return <div className="p-8 text-center text-red-500">问卷不存在</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="text-gray-500 text-sm">{responses.length} 条回答</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'stats' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('stats')}
          >
            统计
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            逐条
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            导出 CSV
          </Button>
        </div>
      </div>

      {view === 'stats' ? (
        <StatsView fields={survey.fields} responses={responses} />
      ) : (
        <ListView fields={survey.fields} responses={responses} />
      )}
    </div>
  )
}

function StatsView({ fields, responses }: { fields: SurveyField[]; responses: SurveyResponse[] }) {
  if (responses.length === 0) {
    return <div className="text-center py-12 text-gray-400">暂无回答数据</div>
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <Card key={field.id} className="p-6">
          <h3 className="font-medium mb-1">{field.label}</h3>
          <p className="text-xs text-gray-400 mb-4">{FIELD_TYPE_LABELS[field.type]}</p>
          <FieldStats field={field} responses={responses} />
        </Card>
      ))}
    </div>
  )
}

function FieldStats({ field, responses }: { field: SurveyField; responses: SurveyResponse[] }) {
  const values = responses.map((r) => r.answers[field.id]).filter((v) => v !== undefined && v !== null)

  switch (field.type) {
    case 'radio':
    case 'select': {
      const counts: Record<string, number> = {}
      for (const v of values) counts[v as string] = (counts[v as string] || 0) + 1
      const total = values.length
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => {
            const count = counts[opt] || 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={opt} className="flex items-center gap-3">
                <span className="text-sm w-24 truncate">{opt}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-16 text-right">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      )
    }
    case 'checkbox': {
      const counts: Record<string, number> = {}
      for (const v of values) {
        for (const item of v as string[]) {
          counts[item] = (counts[item] || 0) + 1
        }
      }
      const total = values.length
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => {
            const count = counts[opt] || 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={opt} className="flex items-center gap-3">
                <span className="text-sm w-24 truncate">{opt}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-16 text-right">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      )
    }
    case 'rating': {
      const nums = values.map(Number)
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length
      return (
        <div>
          <p className="text-2xl font-bold text-indigo-600">{avg.toFixed(1)}</p>
          <p className="text-sm text-gray-400">平均分（共 {nums.length} 份评分）</p>
        </div>
      )
    }
    case 'text':
      return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {values.map((v, i) => (
            <div key={i} className="text-sm p-2 bg-gray-50 rounded">{v as string}</div>
          ))}
        </div>
      )
    case 'ranking': {
      const optionScores: Record<string, number[]> = {}
      for (const v of values) {
        const arr = v as string[]
        arr.forEach((item, idx) => {
          if (!optionScores[item]) optionScores[item] = []
          optionScores[item].push(idx + 1)
        })
      }
      const avgRanks = Object.entries(optionScores).map(([item, scores]) => ({
        item,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      })).sort((a, b) => a.avg - b.avg)
      return (
        <div className="space-y-1">
          {avgRanks.map(({ item, avg }) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <span className="w-32 truncate">{item}</span>
              <span className="text-gray-500">平均排名 {avg.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )
    }
    default:
      return <p className="text-sm text-gray-400">{values.length} 条回答</p>
  }
}

function ListView({ fields, responses }: { fields: SurveyField[]; responses: SurveyResponse[] }) {
  if (responses.length === 0) {
    return <div className="text-center py-12 text-gray-400">暂无回答数据</div>
  }

  return (
    <div className="space-y-4">
      {responses.map((response, idx) => (
        <Card key={response.id} className="p-6">
          <div className="text-sm text-gray-400 mb-4">
            #{idx + 1} · {new Date(response.submitted_at).toLocaleString()}
          </div>
          <div className="space-y-3">
            {fields.map((field) => {
              const value = response.answers[field.id]
              if (value === undefined || value === null) return null
              return (
                <div key={field.id}>
                  <p className="text-xs text-gray-400">{field.label}</p>
                  <p className="text-sm">
                    {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
