'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/auth'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { Survey } from '@/lib/types'
import { Suspense } from 'react'

function SurveyContent() {
  const searchParams = useSearchParams()
  const shareId = searchParams.get('id')
  const bypassRequested = searchParams.get('bypass') === '1'
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [canBypass, setCanBypass] = useState(false)

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return }

    async function load() {
      const { data } = await supabase.from('surveys').select('*').eq('share_id', shareId).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      const s = data as Survey
      if (s.status === 'closed' || s.status === 'draft') { setNotFound(true); setLoading(false); return }
      setSurvey(s)

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-500"><p className="text-lg">问卷不存在或已关闭</p></div>

  // Only bypass password if verified as owner/superadmin
  const settings = canBypass ? { ...survey!.settings, password: undefined } : survey!.settings

  return (
    <SurveyRenderer
      surveyId={survey!.id}
      fields={survey!.fields}
      settings={settings}
      title={survey!.title}
      description={survey!.description}
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
