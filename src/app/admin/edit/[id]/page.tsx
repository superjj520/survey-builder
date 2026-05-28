'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { Survey } from '@/lib/types'

export default function EditSurveyPage() {
  const params = useParams()
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/surveys/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSurvey(data)
        setLoading(false)
      })
  }, [params.id])

  const handleSave = async (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => {
    await fetch(`/api/surveys/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>
  }

  return <EditorLayout survey={survey!} onSave={handleSave} />
}
