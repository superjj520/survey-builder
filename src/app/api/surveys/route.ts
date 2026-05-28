import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { DEFAULT_SETTINGS } from '@/lib/types'

export async function GET() {
  const isAdmin = await verifySession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('surveys')
    .select('*, responses(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifySession()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const share_id = nanoid(8)

  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: body.title || '未命名问卷',
      description: body.description || '',
      fields: body.fields || [],
      settings: body.settings || DEFAULT_SETTINGS,
      status: body.status || 'draft',
      share_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
