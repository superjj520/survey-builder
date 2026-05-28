'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, login, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Survey, DEFAULT_SETTINGS } from '@/lib/types'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { ShareModal } from '@/components/editor/ShareModal'
import { GalleryModal } from '@/components/editor/Gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nanoid } from 'nanoid'

type View = 'login' | 'list' | 'edit'

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
  if (view === 'edit' && currentSurveyId) {
    return <EditView surveyId={currentSurveyId} onBack={() => navigate('list')} />
  }
  return <ListView onNavigate={navigate} />
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-sm">
        <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-indigo-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-1 text-center text-gray-800">问卷管理后台</h1>
        <p className="text-sm text-gray-400 text-center mb-6">请输入管理密码以继续</p>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="管理密码"
          className="mb-3 h-11"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">登录</Button>
      </form>
    </div>
  )
}

function ListView({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [shareModal, setShareModal] = useState<{ url: string; title: string } | null>(null)
  const [showGallery, setShowGallery] = useState(false)

  const STATUS_MAP = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    published: { label: '收集中', color: 'bg-green-100 text-green-700' },
    closed: { label: '已关闭', color: 'bg-red-100 text-red-600' },
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
    if (!confirm('确定要删除此问卷吗？此操作不可撤销。')) return
    await supabase.from('surveys').delete().eq('id', id)
    setSurveys(surveys.filter((s) => s.id !== id))
  }

  const toggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'published' ? 'closed' : 'published'
    await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: newStatus as Survey['status'] } : s))
  }

  const openShare = (survey: Survey) => {
    const url = `${window.location.origin}/s/?id=${survey.share_id}`
    setShareModal({ url, title: survey.title })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">问卷管理</h1>
          </div>
          <button
            onClick={() => { logout(); window.location.reload() }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Top section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">我的问卷</h2>
            <p className="text-sm text-gray-400 mt-1">{surveys.length} 份问卷</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowGallery(true)} className="h-10 gap-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              图库
            </Button>
            <Button onClick={createSurvey} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              新建问卷
            </Button>
          </div>
        </div>

        {/* Survey grid */}
        {surveys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">还没有问卷</p>
            <p className="text-sm text-gray-400 mb-6">点击上方「新建问卷」开始创建</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group"
                onClick={() => onNavigate('edit', survey.id)}
              >
                {/* Accent top bar */}
                <div className="h-2 w-full" style={{ backgroundColor: survey.settings?.theme?.primaryColor || '#4F46E5' }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 truncate flex-1 group-hover:text-indigo-600 transition-colors">
                      {survey.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${STATUS_MAP[survey.status].color}`}>
                      {STATUS_MAP[survey.status].label}
                    </span>
                  </div>

                  {survey.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{survey.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {survey.fields?.length || 0} 题
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openShare(survey)}
                      className="flex-1 text-xs py-1.5 rounded-md bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      分享
                    </button>
                    <button
                      onClick={() => toggleStatus(survey)}
                      className="flex-1 text-xs py-1.5 rounded-md bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      {survey.status === 'published' ? '关闭' : '发布'}
                    </button>
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="text-xs py-1.5 px-3 rounded-md bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New survey card */}
            <button
              onClick={createSurvey}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all min-h-[200px]"
            >
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">新建问卷</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {shareModal && (
        <ShareModal open={true} onClose={() => setShareModal(null)} shareUrl={shareModal.url} title={shareModal.title} />
      )}
      <GalleryModal open={showGallery} onClose={() => setShowGallery(false)} onSelect={() => setShowGallery(false)} />
    </div>
  )
}

function EditView({ surveyId, onBack }: { surveyId: string; onBack: () => void }) {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('surveys').select('*').eq('id', surveyId).single()
      .then(({ data }) => { setSurvey(data as Survey); setLoading(false) })
  }, [surveyId])

  const handleSave = async (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => {
    await supabase.from('surveys').update({ ...data, updated_at: new Date().toISOString() }).eq('id', surveyId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return <EditorLayout survey={survey!} onSave={handleSave} onBack={onBack} />
}
