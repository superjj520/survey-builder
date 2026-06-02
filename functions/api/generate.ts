interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface GenerateRequest {
  userId: string
  messages: ChatMessage[]
}

const SUPABASE_URL = 'https://ybyputkhtrejnqyblvdc.supabase.co'

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string
  DEEPSEEK_KEY: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM_PROMPT = `你是一个专业的问卷设计助手。你的任务是通过对话了解用户需求，然后生成一份高质量的问卷。

流程：
1. 先问用户问卷的主题或目的（如果用户第一条消息已经说了主题，则跳过此步）
2. 问目标受众是谁
3. 问期望的题目数量（建议 5-15 题）
4. 问是否有特殊要求（如特定题型偏好、是否需要评分等）

在每轮回复中自然地引导用户，友好简洁。当你收集到足够的信息后（通常 2-4 轮对话），直接生成问卷。

生成问卷时，在回复末尾另起一行输出：
[GENERATE]
然后紧跟一个 JSON 对象，格式如下：
{"title":"问卷标题","description":"问卷描述","fields":[{"type":"radio","label":"题目文字","options":["选项1","选项2","选项3"],"required":true}, ...]}

支持的 type：
- text（文本输入，可加 "multiline":true 变为多行）
- radio（单选，必须有 options）
- checkbox（多选，必须有 options）
- select（下拉选择，必须有 options）
- rating（评分，1-5星）
- nps（NPS评分，0-10）
- slider（滑块，可加 "sliderMin","sliderMax"）
- date（日期选择）

规则：
1. 题目设计要专业、有逻辑、覆盖全面
2. 选项设计要互斥、完整，避免重叠
3. 合理混搭不同题型，避免全部是单选
4. 重要题目设 required:true
5. 不要在 JSON 之前输出 [GENERATE]，只在你准备好了最终问卷时才输出
6. JSON 必须是合法的，不要有注释或尾逗号`

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieXB1dGtodHJlam5xeWJsdmRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MzI1NiwiZXhwIjoyMDk1NTE5MjU2fQ.JrVwLYu-IqR4Gri5V-8gjTklIKLSBtvUSpHeJB2gMQI'
  const DEEPSEEK_KEY = env.DEEPSEEK_KEY || 'sk-a9cb37504b0c453e8b97ac31e5b709d0'

  try {
    const body: GenerateRequest = await request.json()
    const { userId, messages } = body

    if (!userId || !messages) {
      return new Response(JSON.stringify({ error: '参数缺失' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atomically deduct AI credit
    const deductResp = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/deduct_ai_credit`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner_id: userId }),
      }
    )
    const deductResult = await deductResp.json() as { success?: boolean }
    if (!deductResp.ok || (deductResult && deductResult.success === false)) {
      return new Response(JSON.stringify({ error: 'AI 额度已用完' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Call DeepSeek API (streaming)
    const deepseekResp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: apiMessages,
        stream: true,
        temperature: 0.8,
        max_tokens: 4096,
      }),
    })

    if (!deepseekResp.ok) {
      const errText = await deepseekResp.text()
      return new Response(JSON.stringify({ error: 'AI 服务异常', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Stream response back
    return new Response(deepseekResp.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
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
