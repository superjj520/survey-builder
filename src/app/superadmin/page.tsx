'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, getProfile, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Profile, Survey } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

type Tab = 'overview' | 'users' | 'surveys' | 'responses'

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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {([
            ['overview', '数据总览', 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
            ['users', '用户管理', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
            ['surveys', '问卷管理', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
            ['responses', '回答数据', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'],
          ] as const).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                activeTab === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'surveys' && <SurveysPanel />}
        {activeTab === 'responses' && <ResponsesPanel />}
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
      // Get titles for recent
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
    { label: '注册用户', value: stats.totalUsers, color: 'from-blue-500 to-blue-600', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: '问卷总数', value: stats.totalSurveys, color: 'from-purple-500 to-purple-600', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: '回答总数', value: stats.totalResponses, color: 'from-green-500 to-green-600', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { label: '今日新增', value: stats.todayResponses, color: 'from-orange-500 to-orange-600', iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.iconPath} />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? '...' : card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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

// ===== Users Panel =====
function UsersPanel() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers((data || []) as UserWithStats[])
      setLoading(false)
    }
    load()
  }, [])

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    await supabase.from('profiles').update(updates).eq('id', userId)
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u))
  }

  const filtered = users.filter(u =>
    !search || (u.display_name || '').toLowerCase().includes(search.toLowerCase()) || (u.id || '').includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
              <th className="text-left p-4 font-medium text-gray-500">问卷上限</th>
              <th className="text-left p-4 font-medium text-gray-500">AI额度</th>
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
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
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
                  <Select value={user.plan} onValueChange={(val) => updateUser(user.id, { plan: val as Profile['plan'] })}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">免费版</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">企业版</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={user.survey_limit}
                    onChange={(e) => updateUser(user.id, { survey_limit: parseInt(e.target.value) || 5 } as Partial<Profile>)}
                    className="w-16 h-8 text-xs text-center border rounded-lg"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={user.ai_credits}
                    onChange={(e) => updateUser(user.id, { ai_credits: parseInt(e.target.value) || 0 } as Partial<Profile>)}
                    className="w-16 h-8 text-xs text-center border rounded-lg"
                  />
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => updateUser(user.id, { is_admin: !user.is_admin })}
                    className={`text-xs px-2 py-1 rounded-lg ${user.is_admin ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                  >
                    {user.is_admin ? '撤销管理员' : '设为管理员'}
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

// ===== Surveys Panel =====
function SurveysPanel() {
  const [surveys, setSurveys] = useState<(Survey & { user_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false })
      setSurveys((data || []) as Survey[])
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'bg-amber-50 text-amber-700' },
    published: { label: '收集中', color: 'bg-green-50 text-green-700' },
    closed: { label: '已关闭', color: 'bg-gray-100 text-gray-500' },
  }

  const filtered = surveys.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索问卷..." className="pl-9" />
        </div>
        <span className="text-sm text-gray-400">共 {surveys.length} 份问卷</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left p-4 font-medium text-gray-500">问卷标题</th>
              <th className="text-left p-4 font-medium text-gray-500">状态</th>
              <th className="text-left p-4 font-medium text-gray-500">题目数</th>
              <th className="text-left p-4 font-medium text-gray-500">创建时间</th>
              <th className="text-left p-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">无数据</td></tr>
            ) : filtered.map((survey) => (
              <tr key={survey.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-medium text-gray-800">{survey.title}</p>
                  {survey.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{survey.description}</p>}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[survey.status]?.color || ''}`}>
                    {STATUS_MAP[survey.status]?.label || survey.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{survey.fields?.length || 0}</td>
                <td className="p-4 text-gray-400 text-xs">{new Date(survey.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <a
                    href={`/s/?id=${survey.share_id}`}
                    target="_blank"
                    className="text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    预览
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===== Responses Panel =====
function ResponsesPanel() {
  const [responses, setResponses] = useState<{ id: string; survey_id: string; survey_title?: string; submitted_at: string; answers: Record<string, unknown>; metadata?: Record<string, unknown> }[]>([])
  const [surveys, setSurveys] = useState<{ id: string; title: string; fields: { id: string; label: string; type: string }[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterSurvey, setFilterSurvey] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const [{ data: respData }, { data: surveyData }] = await Promise.all([
        supabase.from('responses').select('*').order('submitted_at', { ascending: false }).limit(200),
        supabase.from('surveys').select('id, title, fields'),
      ])
      setSurveys((surveyData || []) as typeof surveys)
      const titleMap = new Map((surveyData || []).map(s => [s.id, s.title]))
      setResponses((respData || []).map(r => ({ ...r, survey_title: titleMap.get(r.survey_id) || '未知问卷' })))
      setLoading(false)
    }
    load()
  }, [])

  // Get field labels for a survey
  const getFieldMap = (surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId)
    if (!survey) return new Map<string, string>()
    return new Map(survey.fields.map(f => [f.id, f.label]))
  }

  const filtered = filterSurvey === 'all' ? responses : responses.filter(r => r.survey_id === filterSurvey)

  // Group responses by survey for stats
  const surveyResponseCounts = new Map<string, number>()
  responses.forEach(r => {
    surveyResponseCounts.set(r.survey_id, (surveyResponseCounts.get(r.survey_id) || 0) + 1)
  })

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 shadow-sm">
          <span className="text-xs text-gray-400">总回答</span>
          <span className="ml-2 text-lg font-bold text-gray-800">{responses.length}</span>
        </div>
        {/* Survey filter */}
        <Select value={filterSurvey} onValueChange={(val) => setFilterSurvey(val || 'all')}>
          <SelectTrigger className="h-9 w-48 text-xs bg-white">
            <SelectValue placeholder="筛选问卷" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部问卷</SelectItem>
            {surveys.filter(s => surveyResponseCounts.has(s.id)).map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} ({surveyResponseCounts.get(s.id) || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400">
          {filterSurvey !== 'all' && `${filtered.length} 条结果`}
        </span>
      </div>

      {/* Response cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-400">暂无回答数据</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((resp, idx) => {
            const fieldMap = getFieldMap(resp.survey_id)
            const isExpanded = expandedId === resp.id
            const answerEntries = Object.entries(resp.answers || {})

            return (
              <div key={resp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : resp.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{resp.survey_title}</p>
                    <p className="text-xs text-gray-400">{new Date(resp.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{answerEntries.length} 题</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="space-y-2">
                      {answerEntries.map(([fieldId, value]) => {
                        const label = fieldMap.get(fieldId) || fieldId
                        const displayValue = formatAnswerValue(value)
                        return (
                          <div key={fieldId} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                            <span className="text-xs text-gray-500 font-medium w-32 flex-shrink-0 pt-0.5">{label}</span>
                            <span className="text-sm text-gray-800 flex-1">{displayValue}</span>
                          </div>
                        )
                      })}
                    </div>
                    {resp.metadata && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-[10px] text-gray-300">
                          UA: {(resp.metadata.userAgent as string || '').slice(0, 80)}...
                        </p>
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
