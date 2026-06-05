'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/auth'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { Survey } from '@/lib/types'
import { FileText, ClipboardList } from 'lucide-react'
import { Suspense } from 'react'

function SurveyContent() {
  const searchParams = useSearchParams()
  const shareId = searchParams.get('id')
  const bypassRequested = searchParams.get('bypass') === '1'
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [canBypass, setCanBypass] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return }

    async function load() {
      const { data, error } = await supabase.from('surveys').select('*').eq('share_id', shareId).single()
      if (error) {
        console.error('[Survey Load Error]', error.code, error.message, 'share_id:', shareId)
        // PGRST116 = no rows found (RLS filtered or doesn't exist)
        if (error.code === 'PGRST116') {
          setErrorMsg('问卷不存在或未发布')
        } else {
          setErrorMsg(`加载失败: ${error.message}`)
        }
        setNotFound(true)
        setLoading(false)
        return
      }
      if (!data) { setNotFound(true); setLoading(false); return }
      const s = data as Survey
      if (s.status === 'closed' || s.status === 'draft') { setNotFound(true); setLoading(false); return }
      setSurvey(s)

      // Update document title for WeChat sharing
      document.title = `${s.title} - 趣测小屋`
      // Update OG meta tags dynamically for social sharing
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
        if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el) }
        el.content = content
      }
      setMeta('og:title', s.title)
      setMeta('og:description', s.description || '快来参与测试吧！')
      setMeta('og:type', 'website')

      // Verify bypass permission: must be logged-in admin or survey owner
      if (bypassRequested) {
        try {
          const profile = await getProfile()
          if (profile && (profile.is_admin || profile.id === (data as { user_id?: string }).user_id)) {
            setCanBypass(true)
          }
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [shareId, bypassRequested])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
          <FileText className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-sm text-gray-400">加载问卷...</p>
      </div>
    </div>
  )
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white flex-col gap-3 p-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-lg font-medium text-gray-600">{errorMsg || '问卷不存在或已关闭'}</p>
      <p className="text-xs text-gray-300">ID: {shareId}</p>
      <a href="/" className="mt-4 text-sm text-indigo-500 hover:text-indigo-700">← 返回首页</a>
    </div>
  )

  // Only bypass password if verified as owner/superadmin
  const settings = canBypass ? { ...survey!.settings, password: undefined } : survey!.settings

  return (
    <SurveyRenderer
      surveyId={survey!.id}
      fields={survey!.fields || []}
      settings={settings}
      title={survey!.title}
      description={survey!.description || ''}
    />
  )
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>}>
      <SurveyContent />
    </Suspense>
  )
}
