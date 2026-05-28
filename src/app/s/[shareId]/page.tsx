import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { Survey } from '@/lib/types'

interface PageProps {
  params: Promise<{ shareId: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { shareId } = await params

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('share_id', shareId)
    .eq('status', 'published')
    .single()

  if (!survey) notFound()

  const typedSurvey = survey as Survey

  return (
    <SurveyRenderer
      surveyId={typedSurvey.id}
      fields={typedSurvey.fields}
      settings={typedSurvey.settings}
      title={typedSurvey.title}
      description={typedSurvey.description}
    />
  )
}
