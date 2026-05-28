'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { Survey } from '@/lib/types'
import { Suspense } from 'react'

function SurveyContent() {
  const searchParams = useSearchParams()
  const shareId = searchParams.get('id')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return }
    supabase
      .from('surveys')
      .select('*')
      .eq('share_id', shareId)
      .single()
      .then(({ data }) => {
        if (data) {
          const s = data as Survey
          if (s.status === 'closed') { setNotFound(true) }
          else if (s.status === 'draft') { setNotFound(true) }
          else { setSurvey(s) }
        } else { setNotFound(true) }
        setLoading(false)
      })
  }, [shareId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-500"><p className="text-lg">问卷不存在或已关闭</p></div>

  return (
    <SurveyRenderer
      surveyId={survey!.id}
      fields={survey!.fields}
      settings={survey!.settings}
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
