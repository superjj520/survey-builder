import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { survey_id, answers, metadata } = body

  // Verify survey is published
  const { data: survey } = await supabase
    .from('surveys')
    .select('status')
    .eq('id', survey_id)
    .single()

  if (!survey || survey.status !== 'published') {
    return NextResponse.json({ error: '问卷未发布或不存在' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('responses')
    .insert({
      survey_id,
      answers,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
