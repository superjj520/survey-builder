'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SurveyListItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'closed'
  share_id: string
  created_at: string
  responses: { count: number }[]
}

const STATUS_MAP = {
  draft: { label: '草稿', variant: 'secondary' as const },
  published: { label: '已发布', variant: 'default' as const },
  closed: { label: '已关闭', variant: 'destructive' as const },
}

export default function AdminPage() {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/surveys')
      .then((res) => res.json())
      .then((data) => {
        setSurveys(data)
        setLoading(false)
      })
  }, [])

  const createSurvey = async () => {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const survey = await res.json()
    router.push(`/admin/edit/${survey.id}`)
  }

  const deleteSurvey = async (id: string) => {
    if (!confirm('确定要删除此问卷吗？')) return
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' })
    setSurveys(surveys.filter((s) => s.id !== id))
  }

  const toggleStatus = async (survey: SurveyListItem) => {
    const newStatus = survey.status === 'published' ? 'closed' : 'published'
    await fetch(`/api/surveys/${survey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSurveys(surveys.map((s) => s.id === survey.id ? { ...s, status: newStatus } : s))
  }

  const copyLink = (shareId: string) => {
    const url = `${window.location.origin}/s/${shareId}`
    navigator.clipboard.writeText(url)
    alert('链接已复制')
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>
  }

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
                  <Badge variant={STATUS_MAP[survey.status].variant}>
                    {STATUS_MAP[survey.status].label}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400">
                  {survey.responses?.[0]?.count || 0} 条回答 · 创建于 {new Date(survey.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/edit/${survey.id}`)}>
                  编辑
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/results/${survey.id}`)}>
                  统计
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyLink(survey.share_id)}>
                  复制链接
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(survey)}>
                  {survey.status === 'published' ? '关闭' : '发布'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteSurvey(survey.id)} className="text-red-500">
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
