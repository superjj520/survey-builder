'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, login, register, logout, resetPassword, getSession, getProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Survey, Profile, DEFAULT_SETTINGS } from '@/lib/types'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { ShareModal } from '@/components/editor/ShareModal'
import { GalleryModal } from '@/components/editor/Gallery'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nanoid } from 'nanoid'

type View = 'login' | 'list' | 'edit'

export default function AdminPage() {
  const [view, setView] = useState<View>('login')
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    isAuthenticated().then(async (authed) => {
      if (authed) {
        setView('list')
        const p = await getProfile()
        setProfile(p)
      }
      setAuthChecking(false)
    })
  }, [])

  const navigate = (v: View, surveyId?: string) => {
    setView(v)
    if (surveyId) setCurrentSurveyId(surveyId)
  }

  const handleAuthSuccess = async () => {
    setView('list')
    const p = await getProfile()
    setProfile(p)
  }

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">加载中...</div></div>
  }

  if (view === 'login') return <AuthView onSuccess={handleAuthSuccess} />
  if (view === 'edit' && currentSurveyId) {
    return <EditView surveyId={currentSurveyId} onBack={() => navigate('list')} />
  }
  return <ListView onNavigate={navigate} profile={profile} />
}

function AuthView({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(email, password)
    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || '登录失败')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    setLoading(true)
    const result = await register(email, password, displayName || email.split('@')[0])
    if (result.success) {
      if (result.needsVerification) {
        setMessage('注册成功！请检查邮箱完成验证后登录。')
        setMode('login')
      } else {
        onSuccess()
      }
    } else {
      setError(result.error || '注册失败')
    }
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await resetPassword(email)
    if (result.success) {
      setMessage('重置链接已发送到您的邮箱')
      setMode('login')
    } else {
      setError(result.error || '发送失败')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-sm">
        <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-indigo-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-1 text-center text-gray-800">
          {mode === 'login' ? '问卷管理后台' : mode === 'register' ? '创建账号' : '重置密码'}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {mode === 'login' ? '登录后管理您的问卷' : mode === 'register' ? '注册一个新账号开始使用' : '输入邮箱接收重置链接'}
        </p>

        {message && <p className="text-green-600 text-sm mb-3 text-center bg-green-50 p-2 rounded-lg">{message}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" className="mb-3 h-11" required />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="mb-3 h-11" required />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => { setMode('register'); setError(''); setMessage('') }} className="text-xs text-indigo-500 hover:text-indigo-700">
                注册新账号
              </button>
              <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage('') }} className="text-xs text-gray-400 hover:text-gray-600">
                忘记密码
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="昵称（选填）" className="mb-3 h-11" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" className="mb-3 h-11" required />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少6位）" className="mb-3 h-11" required />
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="确认密码" className="mb-3 h-11" required />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">
              {loading ? '注册中...' : '注册'}
            </Button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage('') }} className="text-xs text-gray-400 hover:text-gray-600">
                已有账号？去登录
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="注册邮箱" className="mb-3 h-11" required />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">
              {loading ? '发送中...' : '发送重置链接'}
            </Button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage('') }} className="text-xs text-gray-400 hover:text-gray-600">
                返回登录
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ListView({ onNavigate, profile }: { onNavigate: (v: View, id?: string) => void; profile: Profile | null }) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [shareModal, setShareModal] = useState<{ url: string; title: string } | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all')
  const { confirm, dialog: confirmDialog } = useConfirm()

  const STATUS_MAP = {
    draft: { label: '草稿', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    published: { label: '收集中', color: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
    closed: { label: '已关闭', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  }

  useEffect(() => {
    supabase.from('surveys').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setSurveys((data || []) as Survey[]); setLoading(false) })
  }, [])

  const filteredSurveys = surveys.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const createSurvey = async () => {
    const session = await getSession()
    const { data } = await supabase.from('surveys').insert({
      title: '未命名问卷', description: '', fields: [], settings: DEFAULT_SETTINGS, status: 'draft', share_id: nanoid(8),
      user_id: session?.user?.id,
    }).select().single()
    if (data) onNavigate('edit', data.id)
  }

  const deleteSurvey = async (id: string) => {
    const ok = await confirm({ title: '确定要删除此问卷吗？', description: '此操作不可撤销。', variant: 'danger' })
    if (!ok) return
    await supabase.from('surveys').delete().eq('id', id)
    setSurveys(surveys.filter((s) => s.id !== id))
  }

  const toggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'published' ? 'closed' : 'published'
    await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: newStatus as Survey['status'] } : s))
  }

  const duplicateSurvey = async (survey: Survey) => {
    const session = await getSession()
    const { data } = await supabase.from('surveys').insert({
      title: `${survey.title} (副本)`,
      description: survey.description,
      fields: survey.fields,
      settings: survey.settings,
      status: 'draft',
      share_id: nanoid(8),
      user_id: session?.user?.id,
    }).select().single()
    if (data) setSurveys([data as Survey, ...surveys])
  }

  const openShare = (survey: Survey) => {
    const url = `${window.location.origin}/s/?id=${survey.share_id}`
    setShareModal({ url, title: survey.title })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <Skeleton className="h-2 w-full mb-5 rounded-full" />
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-5" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">问卷管理</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowGallery(true)} className="h-9 gap-1.5 rounded-lg text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              图库
            </Button>
            {/* User panel */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {(profile?.display_name || '?')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-gray-700 leading-tight">{profile?.display_name || '用户'}</p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {profile?.plan === 'admin' ? '管理员' : profile?.plan === 'pro' ? 'Pro' : '免费版'}
                  {profile && profile.plan !== 'admin' && ` · ${surveys.length}/${profile.survey_limit} 问卷`}
                </p>
              </div>
              <button
                onClick={async () => { await logout(); window.location.reload() }}
                className="text-xs text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="退出登录"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Toolbar: search + filter + create */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索问卷..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
              />
            </div>
            {/* Create button */}
            <Button onClick={createSurvey} className="h-10 px-4 sm:px-5 bg-indigo-600 hover:bg-indigo-700 gap-1.5 sm:gap-2 rounded-xl shadow-sm transition-all active:scale-[0.97] flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">新建问卷</span>
            </Button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {([['all', '全部'], ['draft', '草稿'], ['published', '收集中'], ['closed', '已关闭']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex-shrink-0 ${
                  statusFilter === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {key !== 'all' && (
                  <span className="ml-1 text-[10px] opacity-60">
                    {surveys.filter(s => s.status === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Survey grid */}
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {surveys.length === 0 ? (
              <>
                <p className="text-lg font-medium text-gray-500 mb-2">还没有问卷</p>
                <p className="text-sm text-gray-400 mb-6">点击「新建问卷」开始</p>
                <Button onClick={createSurvey} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 px-6 gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  新建问卷
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-500 mb-2">无匹配结果</p>
                <p className="text-sm text-gray-400">换个关键词或筛选条件试试</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden cursor-pointer group"
                onClick={() => onNavigate('edit', survey.id)}
              >
                {/* Accent top bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: survey.settings?.theme?.primaryColor || '#4F46E5' }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 truncate flex-1 group-hover:text-indigo-600 transition-colors">
                      {survey.title}
                    </h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 flex items-center gap-1 ${STATUS_MAP[survey.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[survey.status].dot}`} />
                      {STATUS_MAP[survey.status].label}
                    </span>
                  </div>

                  {survey.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{survey.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
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
                  <div className="flex gap-1.5 pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openShare(survey)}
                      className="flex-1 text-xs py-2 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-all active:scale-[0.97] font-medium"
                    >
                      分享
                    </button>
                    <button
                      onClick={() => duplicateSurvey(survey)}
                      className="flex-1 text-xs py-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all active:scale-[0.97] font-medium"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => toggleStatus(survey)}
                      className="flex-1 text-xs py-2 rounded-lg bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 transition-all active:scale-[0.97] font-medium"
                    >
                      {survey.status === 'published' ? '关闭' : '发布'}
                    </button>
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="text-xs py-2 px-3 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all active:scale-[0.97]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New survey card */}
            <button
              onClick={createSurvey}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all active:scale-[0.98] min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-indigo-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
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
      {confirmDialog}
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

  return <ErrorBoundary><EditorLayout survey={survey!} onSave={handleSave} onBack={onBack} /></ErrorBoundary>
}
