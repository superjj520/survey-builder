const SUPABASE_URL = 'https://ybyputkhtrejnqyblvdc.supabase.co'

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Verify the caller is authenticated and is a superadmin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify token with Supabase to get the caller's identity
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_KEY },
    })
    const userData = await userResp.json() as { id?: string; email?: string }
    if (!userData?.id) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if caller is superadmin
    const profileResp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const profiles = await profileResp.json() as { role: string }[]
    if (!profiles?.[0] || profiles[0].role !== 'superadmin') {
      return new Response(JSON.stringify({ error: '权限不足' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json() as { action: string; userId: string; password?: string }
    const { action, userId } = body

    if (action === 'getUser') {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
      })
      const data = await resp.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'resetPassword') {
      const { password } = body
      if (!password || password.length < 6) {
        return new Response(JSON.stringify({ error: '密码至少6位' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      if (!resp.ok) {
        const errData = await resp.text()
        return new Response(JSON.stringify({ error: '重置失败', detail: errData }), {
          status: resp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: '未知操作' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: '服务器错误', detail: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
