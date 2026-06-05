'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, getProfile, getSession, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Profile, Survey, Template, TemplateCategory, TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_COLORS } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ShieldCheck, LogOut, BarChart3, Users, FileText, ChevronDown, ChevronLeft, ChevronRight, Search, Clock } from 'lucide-react'

interface UserWithStats extends Profile {
  email?: string
  survey_count?: number
  response_count?: number
}

interface PlatformStats {
  totalUsers: number
  totalSurveys: number
  totalResponses: number
  todayResponses: number
}

type Tab = 'overview' | 'users' | 'templates'

export default function SuperAdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    async function check() {
      const authed = await isAuthenticated()
      if (!authed) { window.location.href = '/admin/'; return }
      const profile = await getProfile()
      if (!profile?.is_admin) { window.location.href = '/admin/'; return }
      setAuthorized(true)
      setChecking(false)
    }
    check()
  }, [])

  if (checking || !authorized) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">验证权限中...</div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">超级管理后台</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/" className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100">
              ← 返回前台
            </a>
            <button
              onClick={async () => { await logout(); window.location.href = '/admin/' }}
              className="text-xs text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {([
            ['overview', '数据总览', BarChart3],
            ['users', '用户管理', Users],
            ['templates', '模板管理', FileText],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                activeTab === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'templates' && <TemplatesPanel />}
      </div>
    </div>
  )
}

// ===== Overview Panel =====
function OverviewPanel() {
  const [stats, setStats] = useState<PlatformStats>({ totalUsers: 0, totalSurveys: 0, totalResponses: 0, todayResponses: 0 })
  const [recentResponses, setRecentResponses] = useState<{ id: string; survey_title: string; submitted_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const [users, surveys, responses, todayResp, recent] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('surveys').select('id', { count: 'exact', head: true }),
        supabase.from('responses').select('id', { count: 'exact', head: true }),
        supabase.from('responses').select('id', { count: 'exact', head: true }).gte('submitted_at', today),
        supabase.from('responses').select('id, survey_id, submitted_at').order('submitted_at', { ascending: false }).limit(5),
      ])
      setStats({
        totalUsers: users.count || 0,
        totalSurveys: surveys.count || 0,
        totalResponses: responses.count || 0,
        todayResponses: todayResp.count || 0,
      })
      if (recent.data && recent.data.length > 0) {
        const ids = [...new Set(recent.data.map(r => r.survey_id))]
        const { data: surveyData } = await supabase.from('surveys').select('id, title').in('id', ids)
        const titleMap = new Map((surveyData || []).map(s => [s.id, s.title]))
        setRecentResponses(recent.data.map(r => ({ id: r.id, survey_title: titleMap.get(r.survey_id) || '未知', submitted_at: r.submitted_at })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: '注册用户', value: stats.totalUsers, color: 'from-blue-500 to-blue-600', Icon: Users },
    { label: '问卷总数', value: stats.totalSurveys, color: 'from-purple-500 to-purple-600', Icon: FileText },
    { label: '回答总数', value: stats.totalResponses, color: 'from-green-500 to-green-600', Icon: BarChart3 },
    { label: '今日新增', value: stats.todayResponses, color: 'from-orange-500 to-orange-600', Icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? '...' : card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500" />
          最近活动
        </h3>
        {recentResponses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无最近活动</p>
        ) : (
          <div className="space-y-3">
            {recentResponses.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">收到 <span className="font-medium">{r.survey_title}</span> 的新回答</span>
                <span className="text-xs text-gray-400">{timeAgo(r.submitted_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

// ===== Users Panel (with drill-down to surveys & responses) =====
type UserView = 'list' | 'detail'

function UsersPanel() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<UserView>('list')
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (!profiles) { setLoading(false); return }

      // Get survey counts per user
      const { data: surveys } = await supabase.from('surveys').select('id, user_id')
      const surveyCounts = new Map<string, number>()
      const surveyIds: string[] = []
      ;(surveys || []).forEach(s => {
        surveyCounts.set(s.user_id, (surveyCounts.get(s.user_id) || 0) + 1)
        surveyIds.push(s.id)
      })

      // Get response counts per survey → per user
      const responseCounts = new Map<string, number>()
      if (surveyIds.length > 0) {
        const { data: responses } = await supabase.from('responses').select('survey_id')
        const surveyUserMap = new Map((surveys || []).map(s => [s.id, s.user_id]))
        ;(responses || []).forEach(r => {
          const userId = surveyUserMap.get(r.survey_id)
          if (userId) responseCounts.set(userId, (responseCounts.get(userId) || 0) + 1)
        })
      }

      setUsers(profiles.map(p => ({
        ...p,
        survey_count: surveyCounts.get(p.id) || 0,
        response_count: responseCounts.get(p.id) || 0,
      })) as UserWithStats[])
      setLoading(false)
    }
    load()
  }, [])

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    await supabase.from('profiles').update(updates).eq('id', userId)
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u))
    if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, ...updates } as UserWithStats)
  }

  const filtered = users.filter(u =>
    !search || (u.display_name || '').toLowerCase().includes(search.toLowerCase()) || (u.id || '').includes(search)
  )

  if (view === 'detail' && selectedUser) {
    return (
      <UserDetailPanel
        user={selectedUser}
        onBack={() => { setView('list'); setSelectedUser(null) }}
        onUpdateUser={updateUser}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户..." className="pl-9" />
        </div>
        <span className="text-sm text-gray-400">共 {users.length} 个用户</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left p-4 font-medium text-gray-500">用户</th>
              <th className="text-left p-4 font-medium text-gray-500">套餐</th>
              <th className="text-left p-4 font-medium text-gray-500">问卷数</th>
              <th className="text-left p-4 font-medium text-gray-500">回答数</th>
              <th className="text-left p-4 font-medium text-gray-500">注册时间</th>
              <th className="text-left p-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">无数据</td></tr>
            ) : filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                onClick={() => { setSelectedUser(user); setView('detail') }}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {(user.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.display_name || '未命名'}</p>
                      <p className="text-xs text-gray-400">{user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.plan === 'admin' ? 'bg-red-50 text-red-600' :
                    user.plan === 'pro' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {user.plan === 'free' ? '免费版' : user.plan === 'pro' ? 'Pro' : '管理员'}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{user.survey_count || 0}</td>
                <td className="p-4 text-gray-600">{user.response_count || 0}</td>
                <td className="p-4 text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                    查看详情
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===== User Detail Panel (surveys + responses for one user) =====
function UserDetailPanel({
  user,
  onBack,
  onUpdateUser,
}: {
  user: UserWithStats
  onBack: () => void
  onUpdateUser: (userId: string, updates: Partial<Profile>) => Promise<void>
}) {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, { id: string; answers: Record<string, unknown>; submitted_at: string; metadata?: Record<string, unknown> }[]>>({})
  const [loadingResponses, setLoadingResponses] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('surveys').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setSurveys((data || []) as Survey[])
      // Fetch user email via admin API
      const session = await getSession()
      if (session?.access_token) {
        try {
          const resp = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ action: 'getUser', userId: user.id }),
          })
          const data = await resp.json()
          if (data?.email) setUserEmail(data.email)
          else if (data?.user?.email) setUserEmail(data.user.email)
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetMsg('密码至少 6 位')
      return
    }
    setResetting(true)
    setResetMsg('')
    try {
      const session = await getSession()
      const resp = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'resetPassword', userId: user.id, password: newPassword }),
      })
      const data = await resp.json()
      if (data.success) {
        setResetMsg('密码已重置成功')
        setNewPassword('')
      } else {
        setResetMsg('重置失败: ' + (data.error || '未知错误'))
      }
    } catch {
      setResetMsg('重置失败: 网络错误')
    }
    setResetting(false)
  }

  const loadResponses = async (surveyId: string) => {
    if (responses[surveyId]) return
    setLoadingResponses(surveyId)
    const { data } = await supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false }).limit(100)
    setResponses(prev => ({ ...prev, [surveyId]: (data || []) as typeof responses[string] }))
    setLoadingResponses(null)
  }

  const toggleSurvey = async (surveyId: string) => {
    if (expandedSurvey === surveyId) {
      setExpandedSurvey(null)
    } else {
      setExpandedSurvey(surveyId)
      await loadResponses(surveyId)
    }
  }

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'bg-amber-50 text-amber-700' },
    published: { label: '收集中', color: 'bg-green-50 text-green-700' },
    closed: { label: '已关闭', color: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          返回用户列表
        </button>
      </div>

      {/* User info card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
              {(user.display_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{user.display_name || '未命名用户'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">ID: {user.id}</p>
              <p className="text-xs text-gray-400">邮箱: {userEmail || '加载中...'}</p>
              <p className="text-xs text-gray-400">注册时间: {new Date(user.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={user.plan} onValueChange={(val) => onUpdateUser(user.id, { plan: val as Profile['plan'] })}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">免费版</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => onUpdateUser(user.id, { is_admin: !user.is_admin })}
              className={`text-xs px-3 py-1.5 rounded-lg ${user.is_admin ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              {user.is_admin ? '撤销管理员' : '设为管理员'}
            </button>
          </div>
        </div>

        {/* Password reset */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 mb-2">重置密码</h4>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码（至少6位）"
              className="h-8 w-56 text-xs"
            />
            <Button
              onClick={handleResetPassword}
              disabled={resetting}
              className="h-8 text-xs px-3 bg-orange-500 hover:bg-orange-600"
            >
              {resetting ? '重置中...' : '重置密码'}
            </Button>
            {resetMsg && (
              <span className={`text-xs ${resetMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                {resetMsg}
              </span>
            )}
          </div>
        </div>

        {/* User stats */}
        <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">问卷上限</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={user.survey_limit}
                onChange={(e) => onUpdateUser(user.id, { survey_limit: parseInt(e.target.value) || 5 } as Partial<Profile>)}
                className="w-16 h-7 text-xs text-center border rounded-lg"
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400">AI 额度</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={user.ai_credits}
                onChange={(e) => onUpdateUser(user.id, { ai_credits: parseInt(e.target.value) || 0 } as Partial<Profile>)}
                className="w-16 h-7 text-xs text-center border rounded-lg"
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400">问卷数</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">{surveys.length}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">总回答</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">
              {Object.values(responses).reduce((sum, arr) => sum + arr.length, 0) || user.response_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Surveys list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" />
          该用户的问卷 ({surveys.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : surveys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400">该用户暂无问卷</p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => {
              const isExpanded = expandedSurvey === survey.id
              const surveyResponses = responses[survey.id] || []
              const fieldMap = new Map((survey.fields || []).map(f => [f.id, f.label]))

              return (
                <div key={survey.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Survey header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50"
                    onClick={() => toggleSurvey(survey.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{survey.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[survey.status]?.color || ''}`}>
                          {STATUS_MAP[survey.status]?.label || survey.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {survey.fields?.length || 0} 题 · 创建于 {new Date(survey.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {loadingResponses === survey.id ? '...' : (surveyResponses.length || '0')} 条回答
                      </span>
                      <a
                        href={`/s/?id=${survey.share_id}&bypass=1`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                      >
                        预览
                      </a>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded: responses for this survey */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
                      {loadingResponses === survey.id ? (
                        <div className="p-6 text-center text-gray-400 text-sm">加载回答中...</div>
                      ) : surveyResponses.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">该问卷暂无回答</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {surveyResponses.map((resp, idx) => (
                            <ResponseCard
                              key={resp.id}
                              index={idx + 1}
                              response={resp}
                              fieldMap={fieldMap}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Response Card (expandable) =====
function ResponseCard({
  index,
  response,
  fieldMap,
}: {
  index: number
  response: { id: string; answers: Record<string, unknown>; submitted_at: string; metadata?: Record<string, unknown> }
  fieldMap: Map<string, string>
}) {
  const [expanded, setExpanded] = useState(false)
  const answerEntries = Object.entries(response.answers || {})

  return (
    <div className="bg-white/50">
      <div
        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500">{new Date(response.submitted_at).toLocaleString()}</span>
        </div>
        <span className="text-[10px] text-gray-400">{answerEntries.length} 题</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-1">
          <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
            {answerEntries.map(([fieldId, value]) => {
              const label = fieldMap.get(fieldId) || fieldId
              return (
                <div key={fieldId} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500 font-medium w-28 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-gray-800 flex-1">{formatAnswerValue(value)}</span>
                </div>
              )
            })}
          </div>
          {response.metadata && (
            <p className="text-[10px] text-gray-300 mt-2">
              UA: {(response.metadata.userAgent as string || '').slice(0, 80)}...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return value.join('、') || '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ===== Templates Panel =====
function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [surveys, setSurveys] = useState<{ id: string; title: string; fields: unknown; settings: unknown }[]>([])
  const [form, setForm] = useState({
    title: '', description: '', category: 'personality' as TemplateCategory,
    tags: '', cover_image: '', is_featured: false,
    source_survey: '', fields: '[]', settings: '{}',
  })

  useEffect(() => {
    loadTemplates()
    loadSurveys()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
    setTemplates((data || []) as Template[])
    setLoading(false)
  }

  async function loadSurveys() {
    const { data } = await supabase.from('surveys').select('id, title, fields, settings').order('created_at', { ascending: false }).limit(50)
    setSurveys((data || []) as typeof surveys)
  }

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'personality', tags: '', cover_image: '', is_featured: false, source_survey: '', fields: '[]', settings: '{}' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSourceChange = (surveyId: string | null) => {
    if (!surveyId) return
    setForm(prev => ({ ...prev, source_survey: surveyId }))
    const survey = surveys.find(s => s.id === surveyId)
    if (survey) {
      setForm(prev => ({
        ...prev,
        fields: JSON.stringify(survey.fields),
        settings: JSON.stringify(survey.settings),
      }))
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('请填写标题'); return }
    if (!form.description.trim()) { toast.error('请填写描述'); return }

    let fields, settings
    try {
      fields = JSON.parse(form.fields)
      settings = JSON.parse(form.settings)
    } catch {
      toast.error('JSON 格式错误')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image: form.cover_image.trim() || null,
      is_featured: form.is_featured,
      fields,
      settings,
    }

    if (editingId) {
      const { error } = await supabase.from('templates').update(payload).eq('id', editingId)
      if (error) { toast.error('更新失败: ' + error.message); return }
      toast.success('模板已更新')
    } else {
      const { error } = await supabase.from('templates').insert(payload)
      if (error) { toast.error('创建失败: ' + error.message); return }
      toast.success('模板已创建')
    }
    resetForm()
    loadTemplates()
  }

  const handleEdit = (tpl: Template) => {
    setForm({
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      tags: tpl.tags.join(', '),
      cover_image: tpl.cover_image || '',
      is_featured: tpl.is_featured,
      source_survey: '',
      fields: JSON.stringify(tpl.fields, null, 2),
      settings: JSON.stringify(tpl.settings, null, 2),
    })
    setEditingId(tpl.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此模板？')) return
    await supabase.from('templates').delete().eq('id', id)
    toast.success('已删除')
    loadTemplates()
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('templates').update({ is_featured: !current }).eq('id', id)
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_featured: !current } : t))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">模板管理 ({templates.length})</h3>
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
        >
          + 添加模板
        </Button>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
          <h4 className="font-semibold text-gray-800">{editingId ? '编辑模板' : '添加模板'}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="模板标题" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">分类 *</label>
              <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v as TemplateCategory }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">描述 *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="一句话描述模板用途"
              className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标签（逗号分隔）</label>
              <Input value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="MBTI, 性格, 小红书" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">封面图 URL</label>
              <Input value={form.cover_image} onChange={e => setForm(prev => ({ ...prev, cover_image: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">从现有问卷导入</label>
            <Select value={form.source_survey} onValueChange={handleSourceChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="选择问卷..." /></SelectTrigger>
              <SelectContent>
                {surveys.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label className="text-xs text-gray-600">精选模板（在模板库顶部展示）</label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
              {editingId ? '保存修改' : '创建模板'}
            </Button>
            <Button onClick={resetForm} variant="outline" className="h-8 text-xs">取消</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left p-4 font-medium text-gray-500">模板</th>
              <th className="text-left p-4 font-medium text-gray-500">分类</th>
              <th className="text-left p-4 font-medium text-gray-500">使用次数</th>
              <th className="text-left p-4 font-medium text-gray-500">精选</th>
              <th className="text-left p-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">加载中...</td></tr>
            ) : templates.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">暂无模板，点击上方按钮添加</td></tr>
            ) : templates.map(tpl => (
              <tr key={tpl.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-medium text-gray-800">{tpl.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tpl.description}</p>
                </td>
                <td className="p-4">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: TEMPLATE_CATEGORY_COLORS[tpl.category] }}
                  >
                    {TEMPLATE_CATEGORIES[tpl.category]}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{tpl.use_count}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleFeatured(tpl.id, tpl.is_featured)}
                    className={`text-lg ${tpl.is_featured ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                  >
                    ★
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(tpl)} className="text-xs text-indigo-500 hover:text-indigo-700">编辑</button>
                    <button onClick={() => handleDelete(tpl.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
