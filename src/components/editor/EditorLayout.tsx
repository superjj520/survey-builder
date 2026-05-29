'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { EditorProvider, useEditor } from './EditorContext'
import { FieldCanvas } from './FieldCanvas'
import { SettingsPanel } from './SettingsPanel'
import { SurveyPreview } from './SurveyPreview'
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
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings' | 'preview'>('questions')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await onSave({
        title: state.title,
        description: state.description,
        fields: state.fields,
        settings: state.settings,
      })
      dispatch({ type: 'MARK_SAVED' })
      setLastSaved(new Date().toLocaleTimeString())
      toast.success('已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }, [state.title, state.description, state.fields, state.settings, onSave, dispatch])

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    if (!state.isDirty) return
    const timer = setTimeout(() => { handleSave() }, 30000)
    return () => clearTimeout(timer)
  }, [state.isDirty, handleSave])

  // Keyboard shortcut: Ctrl/Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (state.isDirty) handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isDirty, handleSave])

  const TAB_ICONS = {
    questions: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    preview: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    responses: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    settings: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="px-4 py-2.5 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <input
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
              className="text-base sm:text-lg font-semibold text-gray-800 border-none outline-none bg-transparent w-full truncate hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 px-2 py-1 rounded-lg transition-all"
              placeholder="未命名问卷"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastSaved && !state.isDirty && (
              <span className="text-xs text-gray-400 items-center gap-1 hidden sm:flex">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                {lastSaved}
              </span>
            )}
            {state.isDirty && <span className="text-xs text-amber-500 font-medium hidden sm:block">有更改</span>}
            <Button
              onClick={handleSave}
              disabled={!state.isDirty || saving}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  保存中
                </span>
              ) : '保存'}
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-4 flex gap-1 overflow-x-auto scrollbar-hide">
          {([
            { key: 'questions' as const, label: '问题' },
            { key: 'preview' as const, label: '预览' },
            { key: 'responses' as const, label: '回复' },
            { key: 'settings' as const, label: '设置' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              {TAB_ICONS[tab.key]}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'questions' && <FieldCanvas />}
        {activeTab === 'preview' && <SurveyPreview fields={state.fields} settings={state.settings} title={state.title} description={state.description} />}
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
  const [viewMode, setViewMode] = useState<'stats' | 'individual'>('stats')
  const [selectedIndex, setSelectedIndex] = useState(0)

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
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{responses.length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">总回复数</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {responses.length > 0 ? Math.round((responses.filter(r => Object.keys(r.answers).length === fields.length).length / responses.length) * 100) : 0}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">完成率</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center col-span-2 sm:col-span-1">
            <p className="text-base sm:text-lg font-bold text-amber-600">
              {responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleDateString() : '-'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">最近回复</p>
          </div>
        </div>

        {responses.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('stats')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'stats' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              >
                统计视图
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'individual' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              >
                逐份查看
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>导出 CSV</Button>
          </div>
        )}

        {responses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">暂无回复</p>
            <p className="text-sm">发布并分享问卷后，回复数据将在此展示</p>
          </div>
        ) : viewMode === 'stats' ? (
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
        ) : (
          <div>
            {/* Individual response navigation */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-4 shadow-sm">
              <button
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <span className="text-sm text-gray-600 font-medium">
                第 {selectedIndex + 1} / {responses.length} 份
              </span>
              <button
                onClick={() => setSelectedIndex(Math.min(responses.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === responses.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Response detail */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 text-xs text-gray-400">
                提交时间：{new Date(responses[selectedIndex].submitted_at).toLocaleString()}
              </div>
              <div className="divide-y divide-gray-50">
                {fields.map((field) => {
                  const answer = responses[selectedIndex].answers[field.id]
                  return (
                    <div key={field.id} className="px-5 py-4">
                      <p className="text-xs text-gray-400 mb-1">{field.label}</p>
                      <p className="text-sm text-gray-800">
                        {answer == null ? <span className="text-gray-300">未回答</span> :
                          Array.isArray(answer) ? answer.join('、') : String(answer)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
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
