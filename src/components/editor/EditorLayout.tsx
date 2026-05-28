'use client'

import React, { useState } from 'react'
import { EditorProvider, useEditor } from './EditorContext'
import { FieldCanvas } from './FieldCanvas'
import { SettingsPanel } from './SettingsPanel'
import { Button } from '@/components/ui/button'
import { Survey, SurveyResponse, SurveyField, FIELD_TYPE_LABELS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { exportToCSV } from '@/lib/export'

interface EditorLayoutProps {
  survey?: Survey
  onSave: (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => Promise<void>
  onBack?: () => void
}

function EditorContent({ onSave, onBack, surveyId }: { onSave: EditorLayoutProps['onSave']; onBack?: () => void; surveyId?: string }) {
  const { state, dispatch } = useEditor()
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = async () => {
    await onSave({
      title: state.title,
      description: state.description,
      fields: state.fields,
      settings: state.settings,
    })
    dispatch({ type: 'MARK_SAVED' })
  }

  const tabs = [
    { key: 'questions' as const, label: '问题', icon: '📝' },
    { key: 'responses' as const, label: '回复', icon: '📊' },
    { key: 'settings' as const, label: '设置', icon: '⚙️' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top toolbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-2 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <input
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
              className="text-lg font-semibold text-gray-800 border-none outline-none bg-transparent w-full truncate focus:bg-gray-50 focus:px-2 rounded transition-all"
              placeholder="未命名问卷"
            />
          </div>
          <div className="flex items-center gap-2">
            {state.isDirty && (
              <span className="text-xs text-amber-500 font-medium">未保存</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              预览
            </Button>
            <Button onClick={handleSave} disabled={!state.isDirty} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              {state.isDirty ? '保存' : '已保存'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => dispatch({ type: 'SET_TAB', payload: tab.key })}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                state.activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {state.activeTab === 'questions' && <FieldCanvas />}
        {state.activeTab === 'responses' && <ResponsesTab surveyId={surveyId} />}
        {state.activeTab === 'settings' && <SettingsPanel />}
      </div>

      {/* Preview modal */}
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} state={state} />}
    </div>
  )
}

export function EditorLayout({ survey, onSave, onBack }: EditorLayoutProps) {
  return (
    <EditorProvider>
      <EditorInitializer survey={survey} />
      <EditorContent onSave={onSave} onBack={onBack} surveyId={survey?.id} />
    </EditorProvider>
  )
}

function EditorInitializer({ survey }: { survey?: Survey }) {
  const { dispatch } = useEditor()

  React.useEffect(() => {
    if (survey) {
      dispatch({
        type: 'LOAD_SURVEY',
        payload: {
          title: survey.title,
          description: survey.description,
          fields: survey.fields,
          settings: survey.settings,
        },
      })
    }
  }, [survey, dispatch])

  return null
}

// Preview modal
function PreviewModal({ onClose, state }: { onClose: () => void; state: { title: string; description: string; fields: SurveyField[]; settings: import('@/lib/types').SurveySettings } }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-medium text-gray-600">预览模式</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f0ebf8' }}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="h-2.5 w-full" style={{ backgroundColor: state.settings.theme.primaryColor }} />
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{state.title || '未命名问卷'}</h2>
              {state.description && <p className="text-sm text-gray-500">{state.description}</p>}
            </div>
          </div>
          {state.fields.map((field) => (
            <div key={field.id} className="bg-white rounded-xl shadow-sm border-l-4 p-5 mb-3" style={{ borderLeftColor: state.settings.theme.primaryColor }}>
              <p className="text-sm font-medium text-gray-800">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </p>
              {field.description && <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>}
              <div className="mt-3">
                <PreviewFieldInput field={field} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewFieldInput({ field }: { field: SurveyField }) {
  switch (field.type) {
    case 'text':
      return <div className="border-b-2 border-gray-200 py-2 text-sm text-gray-300">{field.placeholder || '请输入您的回答'}</div>
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map(opt => (
            <div key={opt} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
              {opt}
            </div>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(field.options || []).map(opt => (
            <div key={opt} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-4 h-4 rounded border-2 border-gray-300" />
              {opt}
            </div>
          ))}
        </div>
      )
    case 'rating':
      return <div className="flex gap-1">{Array.from({ length: field.maxRating || 5 }).map((_, i) => <span key={i} className="text-2xl text-gray-200">★</span>)}</div>
    case 'date':
      return <div className="border-b-2 border-gray-200 py-2 text-sm text-gray-300">年/月/日</div>
    case 'select':
      return <div className="border-b-2 border-gray-200 py-2 text-sm text-gray-300">请选择...</div>
    default:
      return <div className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</div>
  }
}

// Responses tab
function ResponsesTab({ surveyId }: { surveyId?: string }) {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const { state } = useEditor()

  React.useEffect(() => {
    if (!surveyId) { setLoading(false); return }
    supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false })
      .then(({ data }) => { setResponses((data || []) as SurveyResponse[]); setLoading(false) })
  }, [surveyId])

  const handleExport = () => {
    const csv = exportToCSV(state.fields, responses)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.title}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>

  if (!surveyId) {
    return <div className="flex items-center justify-center h-full text-gray-400">请先保存问卷后查看回复</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-indigo-600">{responses.length}</p>
            <p className="text-sm text-gray-500 mt-1">总回复数</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">
              {responses.length > 0 ? Math.round((responses.filter(r => Object.keys(r.answers).length === state.fields.length).length / responses.length) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">完成率</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-600">
              {responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleDateString() : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">最近回复</p>
          </div>
        </div>

        {responses.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 CSV
            </Button>
          </div>
        )}

        {/* Per-field stats */}
        {responses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">暂无回复</p>
            <p className="text-sm">分享问卷链接后，回复数据将在此显示</p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.fields.map((field) => (
              <div key={field.id} className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-medium text-gray-800 mb-1">{field.label}</h3>
                <p className="text-xs text-gray-400 mb-4">{responses.filter(r => r.answers[field.id] !== undefined).length} 条回答</p>
                <ResponseFieldStats field={field} responses={responses} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResponseFieldStats({ field, responses }: { field: SurveyField; responses: SurveyResponse[] }) {
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
                <span className="text-sm w-28 truncate text-gray-600">{opt}</span>
                <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-20 text-right">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      )
    }
    case 'checkbox': {
      const counts: Record<string, number> = {}
      for (const v of values) { for (const item of v as string[]) { counts[item] = (counts[item] || 0) + 1 } }
      const total = values.length
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => {
            const count = counts[opt] || 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={opt} className="flex items-center gap-3">
                <span className="text-sm w-28 truncate text-gray-600">{opt}</span>
                <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-20 text-right">{count} ({pct}%)</span>
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
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-indigo-600">{avg.toFixed(1)}</p>
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
                <span key={i} className="text-lg" style={{ color: i < Math.round(avg) ? '#4F46E5' : '#e5e7eb' }}>★</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{nums.length} 份评分</p>
          </div>
        </div>
      )
    }
    case 'text':
      return (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {values.slice(0, 10).map((v, i) => (
            <div key={i} className="text-sm p-2.5 bg-gray-50 rounded-lg text-gray-700">{v as string}</div>
          ))}
          {values.length > 10 && <p className="text-xs text-gray-400 text-center py-2">还有 {values.length - 10} 条...</p>}
        </div>
      )
    default:
      return <p className="text-sm text-gray-400">{values.length} 条回答</p>
  }
}

