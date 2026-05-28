'use client'

import { useRouter } from 'next/navigation'
import { EditorLayout } from '@/components/editor/EditorLayout'

export default function CreateSurveyPage() {
  const router = useRouter()

  const handleSave = async (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const survey = await res.json()
    router.replace(`/admin/edit/${survey.id}`)
  }

  return <EditorLayout onSave={handleSave} />
}
