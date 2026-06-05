'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, login, register, logout, resetPassword, getSession, getProfile, getCurrentUserId } from '@/lib/auth'
import { supabase, supabaseClient } from '@/lib/supabase'
import { Survey, Profile, DEFAULT_SETTINGS, PLAN_LIMITS } from '@/lib/types'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { ShareModal } from '@/components/editor/ShareModal'
import { GalleryModal } from '@/components/editor/Gallery'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { AIGenerateDialog } from '@/components/editor/AIGenerateDialog'
import { LogOut, Search, Zap, MessageCircle, Plus, ArrowUpDown, AlertTriangle, FileText, ClipboardList, Users, Trash2, Link, Copy, LayoutTemplate, Pencil, Send, Archive, RotateCcw, Image, Brain, Heart, Sparkles, Rocket } from 'lucide-react'

type View = 'login' | 'list' | 'edit' | 'reset-password'

export default function AdminPage() {
  const [view, setView] = useState<View>('login')
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let recoveryDetected = false

    // Check URL hash for recovery token (Supabase appends #access_token=...&type=recovery)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash && hash.includes('type=recovery')) {
        recoveryDetected = true
        // Let Supabase client process the hash, then show reset form
        supabaseClient.client.auth.getSession().then(() => {
          setView('reset-password')
          setAuthChecking(false)
        })
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true
        setView('reset-password')
        setAuthChecking(false)
      } else if (event === 'SIGNED_IN' && session && !recoveryDetected) {
        // Wait briefly to see if PASSWORD_RECOVERY follows
        setTimeout(async () => {
          if (recoveryDetected) return
          setView('list')
          const p = await getProfile()
          setProfile(p)
          setAuthChecking(false)
        }, 500)
      }
    })

    // Fallback: if no auth event fires within 3s, check session manually
    const timeout = setTimeout(async () => {
      if (recoveryDetected) return
      const authed = await isAuthenticated()
      if (authed) {
        setView('list')
        const p = await getProfile()
        setProfile(p)
      }
      setAuthChecking(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const navigate = (v: View, surveyId?: string) => {
    setView(v)
    if (surveyId) setCurrentSurveyId(surveyId)
  }

  const handleAuthSuccess = async () => {
    const p = await getProfile()
    setProfile(p)

    // Check for template param
    const params = new URLSearchParams(window.location.search)

    // Direct edit param (from template page redirect)
    const editId = params.get('edit')
    if (editId) {
      window.history.replaceState({}, '', '/admin/')
      setCurrentSurveyId(editId)
      setView('edit')
      return
    }

    const templateId = params.get('template')
    if (templateId) {
      window.history.replaceState({}, '', '/admin/')
      const tpl = BUILTIN_TEMPLATES.find(t => t.id === templateId)
      if (tpl) {
        const userId = await getCurrentUserId()
        const { data: newSurvey } = await supabase.from('surveys').insert({
          user_id: userId,
          title: `${tpl.title} (副本)`,
          description: tpl.description || '',
          fields: tpl.fields,
          settings: tpl.settings,
          status: 'draft',
          share_id: nanoid(8),
        }).select().single()
        if (newSurvey) {
          toast.success('模板已应用')
          setCurrentSurveyId(newSurvey.id)
          setView('edit')
          return
        }
      }
    }

    setView('list')

    // Welcome toast for first-time users
    if (!localStorage.getItem('onboarding_done')) {
      toast.success('欢迎来到趣测小屋！从模板开始，3分钟发布你的第一个测试 ✨')
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (view === 'login') return <AuthView onSuccess={handleAuthSuccess} />
  if (view === 'reset-password') return <ResetPasswordView onSuccess={handleAuthSuccess} />
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
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">趣测小屋</h2>
          <p className="text-xs text-gray-400 mt-0.5">3分钟创建爆款测试，让内容自发传播</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-xl font-bold mb-1 text-center text-gray-800">
          {mode === 'login' ? '登录' : mode === 'register' ? '创建账号' : '重置密码'}
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

        {/* Feature highlights */}
        <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> AI对话</span>
          <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> 自动计分</span>
          <span className="flex items-center gap-1"><Send className="w-3 h-3" /> 移动适配</span>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordView({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    setLoading(true)
    const { error: err } = await supabaseClient.client.auth.updateUser({ password })
    if (err) {
      setError(err.message)
    } else {
      toast.success('密码重置成功')
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-sm">
        <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-indigo-100 flex items-center justify-center">
          <FileText className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold mb-1 text-center text-gray-800">设置新密码</h1>
        <p className="text-sm text-gray-400 text-center mb-6">请输入您的新密码</p>

        <form onSubmit={handleSubmit}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="新密码（至少6位）" className="mb-3 h-11" required />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="确认新密码" className="mb-3 h-11" required />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700">
            {loading ? '提交中...' : '确认重置'}
          </Button>
        </form>
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
  const [sortBy, setSortBy] = useState<'newest' | 'responses'>('newest')
  const [showAIGenerate, setShowAIGenerate] = useState(false)
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { confirm, dialog: confirmDialog } = useConfirm()

  const STATUS_MAP = {
    draft: { label: '草稿', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    published: { label: '收集中', color: 'bg-green-50 text-green-700', dot: 'bg-green-400' },
    closed: { label: '已归档', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  }

  useEffect(() => {
    getCurrentUserId().then(userId => {
      if (!userId) { setLoading(false); return }
      supabase.from('surveys').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Load surveys error:', error)
            toast.error(`加载失败: ${error.message}`)
          }
          const surveyList = (data || []) as Survey[]
          setSurveys(surveyList)
          setLoading(false)
          // Show onboarding for new users
          if (surveyList.length === 0 && !localStorage.getItem('onboarding_done')) {
            setShowOnboarding(true)
          }
          // Fetch response counts
          if (surveyList.length > 0) {
            supabase.from('responses').select('survey_id')
              .in('survey_id', surveyList.map(s => s.id))
              .then(({ data: respData }) => {
                const counts: Record<string, number> = {}
                for (const r of (respData || [])) {
                  counts[r.survey_id] = (counts[r.survey_id] || 0) + 1
                }
                setResponseCounts(counts)
              })
          }
        })
    })
  }, [])

  const filteredSurveys = surveys.filter(s => {
    if (statusFilter === 'all' && s.status === 'closed') return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'responses') return (responseCounts[b.id] || 0) - (responseCounts[a.id] || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const createSurvey = async () => {
    const userId = await getCurrentUserId()
    if (!userId) {
      console.error('No user id when creating survey')
      return
    }
    // Check survey limit based on plan
    const currentProfile = await getProfile()
    const limits = PLAN_LIMITS[currentProfile?.plan || 'free']
    if (surveys.length >= limits.surveys) {
      toast.error(`已达问卷上限（${limits.surveys} 份），请升级到 Pro 版`)
      return
    }
    const { data, error } = await supabase.from('surveys').insert({
      title: '未命名问卷', description: '', fields: [], settings: DEFAULT_SETTINGS, status: 'draft', share_id: nanoid(8),
      user_id: userId,
    }).select().single()
    if (error) {
      console.error('Create survey error:', error)
      return
    }
    if (data) onNavigate('edit', data.id)
  }

  const createChatSurvey = async () => {
    const userId = await getCurrentUserId()
    if (!userId) return
    const currentProfile = await getProfile()
    const limits = PLAN_LIMITS[currentProfile?.plan || 'free']
    if (surveys.length >= limits.surveys) {
      toast.error(`已达问卷上限（${limits.surveys} 份），请升级到 Pro 版`)
      return
    }
    const { data, error } = await supabase.from('surveys').insert({
      title: '未命名场景对话',
      description: '',
      fields: [],
      settings: { ...DEFAULT_SETTINGS, displayMode: 'chat' },
      status: 'draft',
      share_id: nanoid(8),
      user_id: userId,
    }).select().single()
    if (error) {
      console.error('Create chat survey error:', error)
      return
    }
    if (data) onNavigate('edit', data.id)
  }

  const deleteSurvey = async (id: string) => {
    const ok = await confirm({ title: '确定要删除此问卷吗？', description: '此操作不可撤销。', variant: 'danger' })
    if (!ok) return
    await supabase.from('surveys').delete().eq('id', id)
    setSurveys(surveys.filter((s) => s.id !== id))
  }

  const toggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'published' ? 'closed' : survey.status === 'closed' ? 'draft' : 'published'
    await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: newStatus as Survey['status'] } : s))
  }

  const publishSurvey = async (survey: Survey) => {
    await supabase.from('surveys').update({ status: 'published' }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: 'published' as Survey['status'] } : s))
    toast.success('问卷已发布')
  }

  const archiveSurvey = async (survey: Survey) => {
    const ok = await confirm({ title: '确定要归档此问卷吗？', description: '归档后将停止收集回复，可随时恢复为草稿。' })
    if (!ok) return
    await supabase.from('surveys').update({ status: 'closed' }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: 'closed' as Survey['status'] } : s))
    toast.success('问卷已归档')
  }

  const unpublishSurvey = async (survey: Survey) => {
    await supabase.from('surveys').update({ status: 'draft' }).eq('id', survey.id)
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: 'draft' as Survey['status'] } : s))
    toast.success('问卷已设为草稿')
  }

  const duplicateSurvey = async (survey: Survey) => {
    const userId = await getCurrentUserId()
    const { data } = await supabase.from('surveys').insert({
      title: `${survey.title} (副本)`,
      description: survey.description,
      fields: survey.fields,
      settings: survey.settings,
      status: 'draft',
      share_id: nanoid(8),
      user_id: userId,
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
              <FileText className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-lg font-bold text-gray-800">问卷管理</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <a href="/superadmin/" className="h-9 px-3 rounded-lg text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 flex items-center gap-1.5 transition-colors font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                超管
              </a>
            )}
            <Button variant="outline" onClick={() => setShowGallery(true)} className="h-9 gap-1.5 rounded-lg text-xs">
              <Image className="w-3.5 h-3.5" />
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
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Stats dashboard */}
        {surveys.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-indigo-600">{surveys.length}</p>
              <p className="text-[11px] text-gray-400">问卷总数</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-green-600">{Object.values(responseCounts).reduce((a, b) => a + b, 0)}</p>
              <p className="text-[11px] text-gray-400">总回复数</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-amber-600">{surveys.filter(s => s.status === 'published').length}</p>
              <p className="text-[11px] text-gray-400">收集中</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-purple-600">
                {surveys.length > 0 ? Math.round(Object.values(responseCounts).reduce((a, b) => a + b, 0) / surveys.length) : 0}
              </p>
              <p className="text-[11px] text-gray-400">平均回复/卷</p>
            </div>
          </div>
        )}

        {/* Toolbar: search + filter + create */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索问卷..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
              />
            </div>
            {/* AI Generate button */}
            <Button onClick={() => setShowAIGenerate(true)} variant="outline" className="h-10 px-4 gap-1.5 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 transition-all active:scale-[0.97] flex-shrink-0">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">AI 问卷生成</span>
            </Button>
            {/* AI Scene Chat button */}
            <Button onClick={createChatSurvey} variant="outline" className="h-10 px-4 gap-1.5 rounded-xl border-pink-200 text-pink-700 hover:bg-pink-50 transition-all active:scale-[0.97] flex-shrink-0">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">AI 场景对话</span>
            </Button>
            {/* Templates button */}
            <a href="/templates" className="inline-flex items-center h-10 px-4 gap-1.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all active:scale-[0.97] flex-shrink-0 text-sm font-medium">
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">模板库</span>
            </a>
            {/* Create button */}
            <Button onClick={createSurvey} className="h-10 px-4 sm:px-5 bg-indigo-600 hover:bg-indigo-700 gap-1.5 sm:gap-2 rounded-xl shadow-sm transition-all active:scale-[0.97] flex-shrink-0">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">手动新建问卷</span>
            </Button>
          </div>

          {/* Status filter + Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto scrollbar-hide flex-1">
              {([['all', '全部'], ['draft', '草稿'], ['published', '收集中'], ['closed', '已归档']] as const).map(([key, label]) => (
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
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'responses' : 'newest')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-700 transition-all flex-shrink-0"
              title="切换排序"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === 'newest' ? '最新' : '回答数'}
            </button>
          </div>
        </div>

        {/* Limit warning */}
        {profile && profile.plan !== 'admin' && (() => {
          const limits = PLAN_LIMITS[profile.plan || 'free']
          const usage = surveys.length / limits.surveys
          if (usage >= 0.8 && usage < 1) return (
            <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              问卷数即将达到上限（{surveys.length}/{limits.surveys}），升级 Pro 可创建更多问卷
            </div>
          )
          if (usage >= 1) return (
            <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              已达问卷上限（{limits.surveys} 份），请升级到 Pro 版以创建更多问卷
            </div>
          )
          return null
        })()}

        {/* Survey grid */}
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
            </div>
            {surveys.length === 0 ? (
              <>
                <p className="text-lg font-medium text-gray-500 mb-2">还没有问卷</p>
                <p className="text-sm text-gray-400 mb-6">从模板快速开始，或创建空白问卷</p>
                <div className="flex items-center gap-3 justify-center flex-wrap mb-8">
                  <Button onClick={createSurvey} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 px-6 gap-2">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    新建问卷
                  </Button>
                  <Button onClick={() => setShowAIGenerate(true)} variant="outline" className="rounded-xl h-11 px-6 gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Zap className="w-4 h-4" />
                    AI 生成
                  </Button>
                </div>
                {/* Recommended templates */}
                <div className="max-w-2xl mx-auto">
                  <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1"><Zap className="w-3 h-3" /> 热门模板，一键开始</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {BUILTIN_TEMPLATES.filter(t => t.is_featured).slice(0, 4).map(tpl => (
                      <a
                        key={tpl.id}
                        href={`/templates`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-indigo-400">{tpl.category === 'personality' ? <Brain className="w-5 h-5" /> : tpl.category === 'social' ? <Heart className="w-5 h-5" /> : <Zap className="w-5 h-5" />}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{tpl.title}</p>
                          <p className="text-[11px] text-gray-400 truncate">{tpl.fields.length}题 · {tpl.use_count}人用过</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <a href="/templates" className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-3 transition-colors">
                    查看全部模板 →
                  </a>
                </div>
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
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all overflow-hidden cursor-pointer group"
                onClick={() => onNavigate('edit', survey.id)}
              >
                {/* Accent top bar - color mapped to status */}
                <div className="h-[3px] w-full" style={{
                  background: survey.status === 'published'
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : survey.status === 'closed'
                      ? 'linear-gradient(90deg, #94a3b8, #64748b)'
                      : 'linear-gradient(90deg, #f59e0b, #eab308)'
                }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 mb-2 ${
                        survey.status === 'published' ? 'bg-green-50 text-green-600' :
                        survey.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[survey.status].dot}`} />
                        {STATUS_MAP[survey.status].label}
                      </span>
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors text-[15px]">
                        {survey.title}
                      </h3>
                    </div>
                    {/* Quick status action */}
                    <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      {survey.status === 'draft' && (
                        <button
                          onClick={() => publishSurvey(survey)}
                          className="h-6 px-2 rounded-md bg-green-50 text-green-600 text-[10px] font-medium flex items-center gap-1 hover:bg-green-100 transition-colors"
                          title="发布"
                        >
                          <Send className="w-3 h-3" />
                          发布
                        </button>
                      )}
                      {survey.status === 'published' && (
                        <button
                          onClick={() => archiveSurvey(survey)}
                          className="h-6 px-2 rounded-md bg-slate-50 text-slate-500 text-[10px] font-medium flex items-center gap-1 hover:bg-slate-100 transition-colors"
                          title="归档"
                        >
                          <Archive className="w-3 h-3" />
                          归档
                        </button>
                      )}
                      {survey.status === 'closed' && (
                        <button
                          onClick={() => unpublishSurvey(survey)}
                          className="h-6 px-2 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium flex items-center gap-1 hover:bg-amber-100 transition-colors"
                          title="恢复为草稿"
                        >
                          <RotateCcw className="w-3 h-3" />
                          恢复
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                        <ClipboardList className="w-3 h-3 text-slate-400" />
                      </span>
                      <span className="text-xs text-slate-500">{survey.fields?.length || 0}题</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                        <Users className="w-3 h-3 text-green-500" />
                      </span>
                      <span className="text-xs text-green-600 font-semibold">{responseCounts[survey.id] || 0} 回复</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] text-slate-300">{new Date(survey.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="flex-1 h-9 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors active:scale-[0.97]"
                      onClick={() => onNavigate('edit', survey.id)}
                    >
                      <Pencil className="w-3 h-3" />
                      编辑
                    </button>
                    <button
                      onClick={() => openShare(survey)}
                      className="h-9 px-3 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                      title="分享"
                    >
                      <Link className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => duplicateSurvey(survey)}
                      className="h-9 px-3 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                      title="复制"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="h-9 px-3 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New survey card */}
            <button
              onClick={createSurvey}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all active:scale-[0.98] min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6" strokeWidth={1.5} />
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
      <AIGenerateDialog
        open={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        userId={profile?.id || ''}
        onGenerated={async (survey) => {
          const userId = await getCurrentUserId()
          if (!userId) return
          const { data } = await supabase.from('surveys').insert({
            title: survey.title,
            description: survey.description,
            fields: survey.fields,
            settings: DEFAULT_SETTINGS,
            status: 'draft',
            share_id: nanoid(8),
            user_id: userId,
          }).select().single()
          if (data) {
            setSurveys([data as Survey, ...surveys])
            onNavigate('edit', data.id)
            toast.success('问卷已生成')
          }
        }}
      />
      {confirmDialog}
      {showOnboarding && <OnboardingModal onClose={() => { setShowOnboarding(false); localStorage.setItem('onboarding_done', '1') }} />}
    </div>
  )
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { icon: <Sparkles className="w-5 h-5 text-amber-500" />, title: '创建问卷', desc: '点击"新建问卷"、"AI 生成"或从模板库选择一个开始' },
    { icon: <Pencil className="w-5 h-5 text-indigo-500" />, title: '编辑内容', desc: '拖拽添加题目，配置选项和逻辑，右侧实时预览效果' },
    { icon: <Rocket className="w-5 h-5 text-green-500" />, title: '发布分享', desc: '点击发布后获取链接和二维码，一键分享到朋友圈' },
  ]
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="p-8 text-center">
          <div className="mb-4 flex justify-center">{steps[step].icon}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{steps[step].title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{steps[step].desc}</p>
        </div>
        <div className="flex justify-center gap-1.5 pb-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-200'}`} />
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              上一步
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              下一步
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              开始使用
            </button>
          )}
        </div>
      </div>
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

  const handleStatusChange = async (status: 'draft' | 'published' | 'closed') => {
    await supabase.from('surveys').update({ status, updated_at: new Date().toISOString() }).eq('id', surveyId)
    setSurvey(s => s ? { ...s, status } : s)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-400">加载问卷...</p>
        </div>
      </div>
    )
  }

  return <ErrorBoundary><EditorLayout survey={survey!} onSave={handleSave} onBack={onBack} onStatusChange={handleStatusChange} /></ErrorBoundary>
}
