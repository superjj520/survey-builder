'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, login, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Survey, DEFAULT_SETTINGS } from '@/lib/types'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SurveyField, SurveyResponse, FIELD_TYPE_LABELS } from '@/lib/types'
import { exportToCSV } from '@/lib/export'
import { nanoid } from 'nanoid'

type View = 'login' | 'list' | 'create' | 'edit' | 'results'

export default function AdminPage() {
  const [view, setView] = useState<View>('login')
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      setView('list')
    }
  }, [])

  const navigate = (v: View, surveyId?: string) => {
    setView(v)
    if (surveyId) setCurrentSurveyId(surveyId)
  }

  if (view === 'login') return <LoginView onSuccess={() => setView('list')} />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate('list')} className="text-lg font-bold">问卷管理</button>
        <button onClick={() => { logout(); setView('login') }} className="text-sm text-gray-500 hover:text-gray-700">
          退出登录
        </button>
      </header>
      <main>
        {view === 'list' && <ListView onNavigate={navigate} />}
        {view === 'create' && <CreateView onNavigate={navigate} />}
        {view === 'edit' && currentSurveyId && <EditView surveyId={currentSurveyId} onNavigate={navigate} />}
        {view === 'results' && currentSurveyId && <ResultsView surveyId={currentSurveyId} />}
      </main>
    </div>
  )
}

function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(password)) {
      onSuccess()
    } else {
      setError('密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-sm border w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center">管理后台登录</h1>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入管理密码" className="mb-4" />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <Button type="submit" className="w-full">登录</Button>
      </form>
    </div>
  )
}

function ListView({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)

  const STATUS_MAP = {
    draft: { label: '草稿', variant: 'secondary' as const },
    published: { label: '已发布', variant: 'default' as const },
    closed: { label: '已关闭', variant: 'destructive' as const },
  }

  useEffect(() => {
    supabase.from('surveys').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setSurveys((data || []) as Survey[]); setLoading(false) })
  }, [])

  const createSurvey = async () => {
    const { data } = await supabase.from('surveys').insert({
      title: '未命名问卷', description: '', fields: [], settings: DEFAULT_SETTINGS, status: 'draft', share_id: nanoid(8),
    }).select().single()
    if (data) onNavigate('edit', data.id)
  }

  const deleteSurvey = async (id: string) => {
    if (!confirm('确定要删除此问卷吗？')) return
    await supabase.from('surveys').delete().eq('id', id)
    setSurveys(surveys.filter((s) => s.id !== id))
  }

  const toggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'published' ? 'closed' : 'published'
    await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: newStatus as Survey['status'] } : s))
  }

  const copyLink = (shareId: string) => {
    const url = `${window.location.origin}/s/?id=${shareId}`
    navigator.clipboard.writeText(url)
    alert('链接已复制')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的问卷</h1>
        <Button onClick={createSurvey}>+ 新建问卷</Button>
      </div>
      {surveys.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">还没有问卷</p>
          <p className="text-sm">点击上方按钮创建第一个问卷</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{survey.title}</span>
                  <Badge variant={STATUS_MAP[survey.status].variant}>{STATUS_MAP[survey.status].label}</Badge>
                </div>
                <div className="text-sm text-gray-400">
                  创建于 {new Date(survey.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => onNavigate('edit', survey.id)}>编辑</Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate('results', survey.id)}>统计</Button>
                <Button variant="outline" size="sm" onClick={() => copyLink(survey.share_id)}>复制链接</Button>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(survey)}>
                  {survey.status === 'published' ? '关闭' : '发布'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteSurvey(survey.id)} className="text-red-500">删除</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateView({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  const handleSave = async (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => {
    const { data: survey } = await supabase.from('surveys').insert({
      ...data, status: 'draft', share_id: nanoid(8),
    }).select().single()
    if (survey) onNavigate('edit', survey.id)
  }
  return <EditorLayout onSave={handleSave} />
}

function EditView({ surveyId, onNavigate }: { surveyId: string; onNavigate: (v: View, id?: string) => void }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('surveys').select('*').eq('id', surveyId).single()
      .then(({ data }) => { setSurvey(data as Survey); setLoading(false) })
  }, [surveyId])

  const handleSave = async (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => {
    await supabase.from('surveys').update({ ...data, updated_at: new Date().toISOString() }).eq('id', surveyId)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>
  return <EditorLayout survey={survey!} onSave={handleSave} />
}

function ResultsView({ surveyId }: { surveyId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'stats' | 'list'>('stats')

  useEffect(() => {
    Promise.all([
      supabase.from('surveys').select('*').eq('id', surveyId).single(),
      supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false }),
    ]).then(([surveyRes, responsesRes]) => {
      setSurvey(surveyRes.data as Survey)
      setResponses((responsesRes.data || []) as SurveyResponse[])
      setLoading(false)
    })
  }, [surveyId])

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
          <Button variant={viewMode === 'stats' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('stats')}>统计</Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>逐条</Button>
          <Button variant="outline" size="sm" onClick={handleExport}>导出 CSV</Button>
        </div>
      </div>
      {viewMode === 'stats' ? <StatsView fields={survey.fields} responses={responses} /> : <ResponseListView fields={survey.fields} responses={responses} />}
    </div>
  )
}

function StatsView({ fields, responses }: { fields: SurveyField[]; responses: SurveyResponse[] }) {
  if (responses.length === 0) return <div className="text-center py-12 text-gray-400">暂无回答数据</div>
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
      for (const v of values) { for (const item of v as string[]) { counts[item] = (counts[item] || 0) + 1 } }
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
      return <div><p className="text-2xl font-bold text-indigo-600">{avg.toFixed(1)}</p><p className="text-sm text-gray-400">平均分（共 {nums.length} 份）</p></div>
    }
    case 'text':
      return <div className="space-y-2 max-h-64 overflow-y-auto">{values.map((v, i) => <div key={i} className="text-sm p-2 bg-gray-50 rounded">{v as string}</div>)}</div>
    default:
      return <p className="text-sm text-gray-400">{values.length} 条回答</p>
  }
}

function ResponseListView({ fields, responses }: { fields: SurveyField[]; responses: SurveyResponse[] }) {
  if (responses.length === 0) return <div className="text-center py-12 text-gray-400">暂无回答数据</div>
  return (
    <div className="space-y-4">
      {responses.map((response, idx) => (
        <Card key={response.id} className="p-6">
          <div className="text-sm text-gray-400 mb-4">#{idx + 1} · {new Date(response.submitted_at).toLocaleString()}</div>
          <div className="space-y-3">
            {fields.map((field) => {
              const value = response.answers[field.id]
              if (value === undefined || value === null) return null
              return (
                <div key={field.id}>
                  <p className="text-xs text-gray-400">{field.label}</p>
                  <p className="text-sm">{Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
