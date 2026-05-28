'use client'

import React, { useState, useEffect } from 'react'
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
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings'>('questions')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      title: state.title,
      description: state.description,
      fields: state.fields,
      settings: state.settings,
    })
    dispatch({ type: 'MARK_SAVED' })
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    if (!state.isDirty) return
    const timer = setTimeout(() => { handleSave() }, 30000)
    return () => clearTimeout(timer)
  }, [state.isDirty, state.fields, state.title, state.description, state.settings])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="px-4 py-2.5 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <input
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
              className="text-lg font-semibold text-gray-800 border-none outline-none bg-transparent w-full truncate hover:bg-gray-50 focus:bg-gray-50 px-2 py-1 rounded transition-colors"
              placeholder="未命名问卷"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastSaved && !state.isDirty && <span className="text-xs text-gray-400">已保存 {lastSaved}</span>}
            {state.isDirty && <span className="text-xs text-amber-500">未保存</span>}
            <Button onClick={handleSave} disabled={!state.isDirty || saving} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? '保存中...' : state.isDirty ? '保存' : '已保存'}
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-4 flex">
          {[
            { key: 'questions' as const, label: '问题' },
            { key: 'responses' as const, label: '回复' },
            { key: 'settings' as const, label: '设置' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'questions' && <FieldCanvas />}
        {activeTab === 'responses' && <ResponsesTab surveyId={surveyId} fields={state.fields} title={state.title} />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export function EditorLayout({ survey, onSave, onBack }: EditorLayoutProps) {
  return (
    <EditorProvider>
      {survey && <EditorInitializer survey={survey} />}
      <EditorContent onSave={onSave} onBack={onBack} surveyId={survey?.id} />
    </EditorProvider>
  )
}

function EditorInitializer({ survey }: { survey: Survey }) {
  const { dispatch } = useEditor()
  useEffect(() => {
    dispatch({
      type: 'LOAD_SURVEY',
      payload: {
        title: survey.title,
        description: survey.description,
        fields: survey.fields,
        settings: survey.settings,
      },
    })
  }, [survey, dispatch])
  return null
}

// Responses tab
function ResponsesTab({ surveyId, fields, title }: { surveyId?: string; fields: SurveyField[]; title: string }) {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!surveyId) { setLoading(false); return }
    supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false })
      .then(({ data }) => { setResponses((data || []) as SurveyResponse[]); setLoading(false) })
  }, [surveyId])

  const handleExport = () => {
    const csv = exportToCSV(fields, responses)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>
  if (!surveyId) return <div className="flex items-center justify-center h-full text-gray-400">请先保存问卷</div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-indigo-600">{responses.length}</p>
            <p className="text-sm text-gray-500 mt-1">总回复数</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">
              {responses.length > 0 ? Math.round((responses.filter(r => Object.keys(r.answers).length === fields.length).length / responses.length) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">完成率</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-lg font-bold text-amber-600">
              {responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleDateString() : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">最近回复</p>
          </div>
        </div>

        {responses.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExport}>导出 CSV</Button>
          </div>
        )}

        {responses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">暂无回复</p>
            <p className="text-sm">分享问卷链接后，数据将在此显示</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => {
              const values = responses.map(r => r.answers[field.id]).filter(v => v != null)
              return (
                <div key={field.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-medium text-gray-800 mb-1">{field.label}</h3>
                  <p className="text-xs text-gray-400 mb-3">{values.length} 条回答</p>
                  <FieldStats field={field} values={values} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FieldStats({ field, values }: { field: SurveyField; values: unknown[] }) {
  if (values.length === 0) return <p className="text-sm text-gray-300">无数据</p>

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
            const pct = Math.round((count / total) * 100)
            return (
              <div key={opt} className="flex items-center gap-3">
                <span className="text-sm w-24 truncate text-gray-600">{opt}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
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
            const pct = Math.round((count / total) * 100)
            return (
              <div key={opt} className="flex items-center gap-3">
                <span className="text-sm w-24 truncate text-gray-600">{opt}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      )
    }
    case 'rating': {
      const nums = values.map(Number)
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length
      return <p className="text-2xl font-bold text-indigo-600">{avg.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ {field.maxRating || 5}</span></p>
    }
    case 'text':
      return (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {values.slice(0, 8).map((v, i) => <div key={i} className="text-sm p-2 bg-gray-50 rounded">{String(v)}</div>)}
          {values.length > 8 && <p className="text-xs text-gray-400 text-center">还有 {values.length - 8} 条</p>}
        </div>
      )
    default:
      return <p className="text-sm text-gray-400">{values.length} 条回答</p>
  }
}
