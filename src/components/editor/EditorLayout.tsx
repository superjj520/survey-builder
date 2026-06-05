'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { EditorProvider, useEditor } from './EditorContext'
import { FieldCanvas } from './FieldCanvas'
import { SettingsPanel } from './SettingsPanel'
import { SurveyPreview } from './SurveyPreview'
import { ShareModal } from './ShareModal'
import { Button } from '@/components/ui/button'
import { Survey, SurveyResponse, SurveyField, FIELD_TYPE_LABELS, PLAN_LIMITS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/auth'
import { exportToCSV, exportToExcel } from '@/lib/export'
import { ChevronLeft, Undo2, Redo2, Share2, ClipboardList, Eye, BarChart3, Settings, Download, ChevronDown, ChevronRight, Filter, Loader2 } from 'lucide-react'

interface EditorLayoutProps {
  survey?: Survey
  onSave: (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => Promise<void>
  onBack?: () => void
  onStatusChange?: (status: 'draft' | 'published' | 'closed') => Promise<void>
}

function EditorContent({ onSave, onBack, surveyId, survey, onStatusChange }: { onSave: EditorLayoutProps['onSave']; onBack?: () => void; surveyId?: string; survey?: Survey; onStatusChange?: EditorLayoutProps['onStatusChange'] }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useEditor()
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings' | 'preview'>(
    state.settings.displayMode === 'chat' ? 'settings' : 'questions'
  )
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [surveyStatus, setSurveyStatus] = useState<'draft' | 'published' | 'closed'>(survey?.status || 'draft')
  const [showShare, setShowShare] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [responseCount, setResponseCount] = useState<number | null>(null)

  // Fetch response count
  useEffect(() => {
    if (!surveyId) return
    const fetchCount = () => {
      supabase.from('responses').select('id', { count: 'exact', head: true }).eq('survey_id', surveyId)
        .then(({ count }) => { if (count !== null) setResponseCount(count) })
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [surveyId])

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

  // Keyboard shortcuts: Ctrl/Cmd+S save, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (state.isDirty) handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isDirty, handleSave, undo, redo])

  const handlePublishToggle = async () => {
    if (!onStatusChange || !survey) return
    setPublishing(true)
    try {
      const newStatus = surveyStatus === 'published' ? 'draft' : 'published'
      // Auto-save first if dirty
      if (state.isDirty) await handleSave()
      await onStatusChange(newStatus)
      setSurveyStatus(newStatus)
      toast.success(newStatus === 'published' ? '问卷已发布' : '已取消发布')
      if (newStatus === 'published') setShowShare(true)
    } catch {
      toast.error('操作失败')
    } finally {
      setPublishing(false)
    }
  }

  const shareUrl = survey ? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/?id=${survey.share_id}` : ''

  const TAB_ICONS = {
    questions: <ClipboardList className="w-4 h-4" />,
    preview: <Eye className="w-4 h-4" />,
    responses: <BarChart3 className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />,
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div className="px-4 py-2.5 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors active:scale-95">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={state.title}
                onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                className="text-sm sm:text-base font-bold text-slate-900 border-none outline-none bg-transparent w-full truncate hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 px-2 py-1 rounded-lg transition-all"
                placeholder="未命名问卷"
              />
              {/* Status dot */}
              {surveyStatus === 'published' && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
              )}
            </div>
            <span className="text-[11px] text-slate-400 px-2">
              {state.isDirty ? '未保存的更改' : lastSaved ? `自动保存于 ${lastSaved}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Undo/Redo combined button group */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="撤销 (Ctrl+Z)"
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-slate-200"
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="重做 (Ctrl+Shift+Z)"
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
            {/* Save button - show only when dirty */}
            {state.isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {saving ? '保存中' : '保存'}
              </button>
            )}
            {survey && onStatusChange && (
              <>
                {surveyStatus === 'published' && (
                  <button
                    onClick={() => setShowShare(true)}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">分享</span>
                  </button>
                )}
                <button
                  onClick={handlePublishToggle}
                  disabled={publishing}
                  className="h-9 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 text-white"
                  style={surveyStatus === 'published'
                    ? { background: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }
                    : { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }
                  }
                >
                  {publishing ? '...' : surveyStatus === 'published' ? '已发布 ✓' : '发布'}
                </button>
              </>
            )}
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
              {tab.key === 'responses' && responseCount !== null && responseCount > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                  {responseCount > 99 ? '99+' : responseCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'questions' && <FieldCanvas />}
        {activeTab === 'preview' && <SurveyPreview fields={state.fields} settings={state.settings} title={state.title} description={state.description} shareId={survey?.share_id} />}
        {activeTab === 'responses' && <ResponsesTab surveyId={surveyId} fields={state.fields} title={state.title} />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      {showShare && survey && (
        <ShareModal open={true} onClose={() => setShowShare(false)} shareUrl={shareUrl} title={state.title} />
      )}
    </div>
  )
}

export function EditorLayout({ survey, onSave, onBack, onStatusChange }: EditorLayoutProps) {
  return (
    <EditorProvider>
      {survey && <EditorInitializer survey={survey} />}
      <EditorContent onSave={onSave} onBack={onBack} surveyId={survey?.id} survey={survey} onStatusChange={onStatusChange} />
    </EditorProvider>
  )
}

function EditorInitializer({ survey }: { survey: Survey }) {
  const { dispatch } = useEditor()
  const loadedRef = React.useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterField, setFilterField] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!surveyId) { setLoading(false); return }
    supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false })
      .then(({ data }) => { setResponses((data || []) as SurveyResponse[]); setLoading(false) })
  }, [surveyId])

  const checkExportPermission = async () => {
    const profile = await getProfile()
    const plan = profile?.plan || 'free'
    if (!PLAN_LIMITS[plan].exportData) {
      toast.error('数据导出为 Pro 功能，请升级后使用')
      return false
    }
    return true
  }

  const handleExport = async () => {
    if (!(await checkExportPermission())) return
    const csv = exportToCSV(fields, filteredResponses)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = async () => {
    if (!(await checkExportPermission())) return
    await exportToExcel(fields, filteredResponses, title)
  }

  // Filter responses
  const filteredResponses = responses.filter(r => {
    if (dateFrom && r.submitted_at < dateFrom) return false
    if (dateTo && r.submitted_at > dateTo + 'T23:59:59.999Z') return false
    if (filterField && filterValue) {
      const val = r.answers[filterField]
      if (val === undefined || val === null) return false
      const strVal = Array.isArray(val) ? val.join(', ') : String(val)
      if (!strVal.toLowerCase().includes(filterValue.toLowerCase())) return false
    }
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>
  if (!surveyId) return <div className="flex items-center justify-center h-full text-gray-400">请先保存问卷</div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{filteredResponses.length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">总回复数{filteredResponses.length !== responses.length ? ` (共${responses.length})` : ''}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {filteredResponses.length > 0 ? Math.round((filteredResponses.filter(r => Object.keys(r.answers).length === fields.length).length / filteredResponses.length) * 100) : 0}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">完成率</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm text-center col-span-2 sm:col-span-1">
            <p className="text-base sm:text-lg font-bold text-amber-600">
              {filteredResponses.length > 0 ? new Date(filteredResponses[0].submitted_at).toLocaleDateString() : '-'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">最近回复</p>
          </div>
        </div>

        {/* 7-day trend mini chart */}
        {responses.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <p className="text-xs text-gray-400 mb-3">近 7 天回复趋势</p>
            <DailyTrendChart responses={responses} />
          </div>
        )}

        {/* Filters */}
        {responses.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
            >
              <Filter className="w-3.5 h-3.5" />
              筛选{(dateFrom || dateTo || filterValue) ? ` (已启用)` : ''}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">开始日期</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">结束日期</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">按字段</label>
                    <select
                      value={filterField}
                      onChange={(e) => { setFilterField(e.target.value); setFilterValue('') }}
                      className="w-full text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
                    >
                      <option value="">不筛选</option>
                      {fields.filter(f => f.type !== 'section').map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">包含值</label>
                    {filterField && fields.find(f => f.id === filterField)?.options ? (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full text-xs border rounded-lg px-2.5 py-1.5 text-gray-600"
                      >
                        <option value="">全部</option>
                        {fields.find(f => f.id === filterField)!.options!.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        placeholder="搜索..."
                        disabled={!filterField}
                        className="w-full text-xs border rounded-lg px-2.5 py-1.5 text-gray-600 disabled:bg-gray-50"
                      />
                    )}
                  </div>
                </div>
                {(dateFrom || dateTo || filterValue) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); setFilterField(''); setFilterValue('') }}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredResponses.length > 0 && (
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
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="w-3.5 h-3.5" />
                导出
                <ChevronDown className="w-3 h-3" />
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={handleExportExcel} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">X</span>
                  Excel (.xlsx)
                </button>
                <button onClick={handleExport} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">C</span>
                  CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredResponses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">{responses.length === 0 ? '暂无回复' : '无匹配结果'}</p>
            <p className="text-sm">{responses.length === 0 ? '发布并分享问卷后，回复数据将在此展示' : '调整筛选条件试试'}</p>
          </div>
        ) : viewMode === 'stats' ? (
          <div className="space-y-4">
            {fields.map((field) => {
              const values = filteredResponses.map(r => r.answers[field.id]).filter(v => v != null)
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
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 font-medium">
                第 {selectedIndex + 1} / {filteredResponses.length} 份
              </span>
              <button
                onClick={() => setSelectedIndex(Math.min(filteredResponses.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === filteredResponses.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Response detail */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 text-xs text-gray-400">
                提交时间：{new Date(filteredResponses[selectedIndex].submitted_at).toLocaleString()}
              </div>
              <div className="divide-y divide-gray-50">
                {fields.map((field) => {
                  const answer = filteredResponses[selectedIndex].answers[field.id]
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

function DailyTrendChart({ responses }: { responses: SurveyResponse[] }) {
  // Calculate daily counts for last 7 days
  const days: { label: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    const count = responses.filter(r => r.submitted_at.slice(0, 10) === dateStr).length
    days.push({ label: date.toLocaleDateString(undefined, { weekday: 'short' }), count })
  }
  const maxCount = Math.max(...days.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1.5 h-16">
      {days.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative flex items-end justify-center h-10">
            <div
              className="w-full rounded-t transition-all duration-300 bg-indigo-400 hover:bg-indigo-500 min-h-[2px]"
              style={{ height: `${maxCount > 0 ? (day.count / maxCount) * 100 : 0}%` }}
              title={`${day.count} 条`}
            />
            {day.count > 0 && (
              <span className="absolute -top-4 text-[10px] text-indigo-600 font-medium">{day.count}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">{day.label}</span>
        </div>
      ))}
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
