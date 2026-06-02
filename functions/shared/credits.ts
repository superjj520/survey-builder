const SUPABASE_URL = 'https://ybyputkhtrejnqyblvdc.supabase.co'

export interface DeductResult {
  success: boolean
  remaining?: number
}

export async function deductCredit(supabaseKey: string, ownerId: string): Promise<DeductResult> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/deduct_ai_credit`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ owner_id: ownerId }),
  })
  if (!resp.ok) return { success: false }
  const result = await resp.json() as DeductResult
  return result || { success: false }
}

export async function getSurveyOwner(supabaseKey: string, surveyId: string): Promise<string | null> {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/surveys?id=eq.${surveyId}&select=user_id`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )
  const data = await resp.json() as { user_id: string }[]
  return data?.[0]?.user_id || null
}
