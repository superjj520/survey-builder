interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  surveyId: string
  messages: ChatMessage[]
  fields: { id: string; label: string; type: string; options?: string[] }[]
  bondTier?: 'stranger' | 'familiar' | 'intimate'
  choiceHistory?: { text: string; hint: string }[]
  chatSettings: {
    chatRole?: string
    chatScene?: string
    chatOpening?: string
    chatPersonality?: string
    chatTone?: string
    chatHabit?: string
    chatBackground?: string
    chatFeatures?: {
      mood?: boolean
      scene?: boolean
      suggest?: boolean
      game?: boolean
      event?: boolean
      choice?: boolean
      bond?: boolean
      milestone?: boolean
    }
    chatMoodList?: { name: string; emoji: string }[]
    chatGameTypes?: ('truth_or_dare' | 'guess' | 'vote' | 'word_chain' | 'quiz' | 'fortune' | 'roleplay' | 'confession')[]
    chatSuggestCount?: number
    chatChoiceMax?: number
    chatMilestoneList?: string[]
    chatEventHints?: string[]
    chatGameConfig?: {
      truth_or_dare?: { truths: string[]; dares: string[] }
      quiz?: { questions: { q: string; options: string[]; answer: number }[] }
      word_chain?: { startWords: string[]; theme?: string }
      roleplay?: { scenarios: string[] }
      fortune?: { cards: { name: string; meaning: string }[] }
    }
    chatBondSpeed?: 'slow' | 'normal' | 'fast'
    chatGameUnlock?: Record<string, number>
    chatMilestoneThresholds?: { name: string; threshold: number }[]
    chatStickerPacks?: { name: string; url: string }[]
    chatRetractEnabled?: boolean
    chatTtsEnabled?: boolean
    chatTtsMode?: 'auto' | 'custom'
  }
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

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieXB1dGtodHJlam5xeWJsdmRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MzI1NiwiZXhwIjoyMDk1NTE5MjU2fQ.JrVwLYu-IqR4Gri5V-8gjTklIKLSBtvUSpHeJB2gMQI'
  const DEEPSEEK_KEY = env.DEEPSEEK_KEY || 'sk-a9cb37504b0c453e8b97ac31e5b709d0'

  try {
    const body: ChatRequest = await request.json()
    const { surveyId, messages, fields, chatSettings, bondTier, choiceHistory } = body

    if (!surveyId || !fields || !messages) {
      return new Response(JSON.stringify({ error: '参数缺失' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get survey owner
    const surveyResp = await fetch(
      `${SUPABASE_URL}/rest/v1/surveys?id=eq.${surveyId}&select=user_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const surveyData = await surveyResp.json() as { user_id: string }[]
    if (!surveyData || surveyData.length === 0) {
      return new Response(JSON.stringify({ error: '问卷不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const ownerId = surveyData[0].user_id

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
        body: JSON.stringify({ owner_id: ownerId }),
      }
    )
    const deductResult = await deductResp.json() as { success?: boolean }
    if (!deductResp.ok || (deductResult && deductResult.success === false)) {
      return new Response(JSON.stringify({ error: 'AI 额度已用完' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build system prompt
    const roleName = chatSettings.chatRole || '问卷助手'
    const scene = chatSettings.chatScene || '你正在帮助用户完成一份问卷调查'
    const personality = chatSettings.chatPersonality || ''
    const tone = chatSettings.chatTone || ''
    const habit = chatSettings.chatHabit || ''
    const background = chatSettings.chatBackground || ''

    const fieldsList = fields.map(f => {
      let desc = `- [${f.id}] ${f.label}`
      if (f.options && f.options.length > 0) {
        desc += `（选项：${f.options.join(' / ')}）`
      }
      if (f.type === 'rating') desc += '（1-5分评分）'
      if (f.type === 'nps') desc += '（0-10分评分）'
      return desc
    }).join('\n')

    // Build personality section
    let personalitySection = ''
    if (personality || tone || habit || background) {
      personalitySection = `
## 性格特征
${personality || '友好、专业'}

## 说话方式
${tone ? `- 语气风格：${tone}` : ''}
${habit ? `- 口癖/习惯：${habit}` : ''}
- 回复长度：保持简短自然，每次1-3句话，像真人聊天
- 可以适当使用动作描写（用*号包裹），如 *微微一笑* *歪着头想了想*

## 背景故事
${background || '无特殊背景'}
`
    }

    // Feature flags (default all enabled)
    const ft = chatSettings.chatFeatures || {}
    const hasMood = ft.mood !== false
    const hasScene = ft.scene !== false
    const hasSuggest = ft.suggest !== false
    const hasGame = ft.game !== false
    const hasEvent = ft.event !== false
    const hasChoice = ft.choice !== false
    const hasBond = ft.bond !== false
    const hasMilestone = ft.milestone !== false

    // Build marker protocol dynamically
    let markerProtocol = ''
    const markerSections: string[] = []

    if (hasMood) {
      const moodList = chatSettings.chatMoodList || [
        { name: 'happy', emoji: '😊' }, { name: 'thinking', emoji: '🤔' },
        { name: 'sad', emoji: '😢' }, { name: 'excited', emoji: '😆' },
        { name: 'shy', emoji: '😳' }, { name: 'angry', emoji: '😤' },
        { name: 'neutral', emoji: '😐' },
      ]
      const moodOptions = moodList.map(m => `[MOOD:${m.name}:强度]`).join(' 或 ')
      markerSections.push(`### MOOD 标记（情绪 + 强度）
在回复开头添加，表示你当前的情绪状态和强度：
${moodOptions}
强度为 1-5 的整数：
- 1 = 微微（淡淡的情绪）
- 2 = 轻微（能感知到但不明显）
- 3 = 中等（正常情绪表达）
- 4 = 强烈（情绪明显）
- 5 = 极致（情绪非常强烈，如大喜大悲）
例如：[MOOD:happy:2] 表示微微开心，[MOOD:excited:5] 表示极度兴奋
每次回复都应该有 MOOD 标记。根据对话内容选择合适的情绪和强度。`)
    }

    if (hasScene) {
      markerSections.push(`### SCENE 标记（场景切换）
仅在场景发生变化时使用${hasMood ? '，放在 MOOD 之后' : ''}：
[SCENE:简短场景描述]
例如：[SCENE:咖啡厅角落，阳光透过玻璃] 或 [SCENE:夜晚的阳台，星光点点]`)
    }

    if (hasSuggest) {
      const suggestCount = chatSettings.chatSuggestCount ?? 4
      markerSections.push(`### SUGGEST 标记（快捷回复建议）
在回复末尾添加 2-${suggestCount} 个建议回复选项，帮助用户快速回答：
[SUGGEST:选项1|选项2|选项3]
注意：当你在引导用户回答有固定选项的问题时，不需要输出 SUGGEST（前端会自动渲染选项）。只在开放性问题或需要引导方向时使用。`)
    }

    if (hasMood || hasScene || hasSuggest) {
      const exampleParts: string[] = []
      if (hasMood) exampleParts.push('[MOOD:excited:4]')
      if (hasScene) exampleParts.push('[SCENE:咖啡厅角落，阳光透过玻璃]')
      markerSections.push(`### 示例
${exampleParts.join('')}
*眼睛一亮，身子往前倾*
真的吗！你也喜欢这个？太巧了吧！

那你平时更喜欢哪种风格的？${hasSuggest ? '\n[SUGGEST:简约现代|复古文艺|日系清新|混搭随性]' : ''}`)
    }

    if (hasGame) {
      const gameTypes = chatSettings.chatGameTypes || ['truth_or_dare', 'guess', 'vote']
      const gameConfig = chatSettings.chatGameConfig || {}
      const gameExamples: string[] = []
      if (gameTypes.includes('truth_or_dare')) gameExamples.push('[GAME:truth_or_dare|真心话|大冒险]')
      if (gameTypes.includes('guess')) gameExamples.push('[GAME:guess|谜题描述]')
      if (gameTypes.includes('vote')) gameExamples.push('[GAME:vote|选项1|选项2|选项3]')
      if (gameTypes.includes('word_chain')) gameExamples.push('[GAME:word_chain|起始词]')
      if (gameTypes.includes('quiz')) gameExamples.push('[GAME:quiz|题目|选项A|选项B|选项C]')
      if (gameTypes.includes('fortune')) gameExamples.push('[GAME:fortune|牌名|含义]')
      if (gameTypes.includes('roleplay')) gameExamples.push('[GAME:roleplay|情境描述]')
      if (gameTypes.includes('confession')) gameExamples.push('[GAME:confession|引导语]')

      // Build custom content hints
      let contentHints = ''
      if (gameTypes.includes('truth_or_dare') && gameConfig.truth_or_dare) {
        const td = gameConfig.truth_or_dare
        if (td.truths?.length) contentHints += `\n真心话题库（请从中选择）：${td.truths.filter(Boolean).join('；')}`
        if (td.dares?.length) contentHints += `\n大冒险题库（请从中选择）：${td.dares.filter(Boolean).join('；')}`
      }
      if (gameTypes.includes('quiz') && gameConfig.quiz?.questions?.length) {
        contentHints += `\n问答题库（请从中出题）：${gameConfig.quiz.questions.filter(q => q.q).map(q => `${q.q}(答案:${q.options?.[q.answer] || ''})`).join('；')}`
      }
      if (gameTypes.includes('fortune') && gameConfig.fortune?.cards?.length) {
        contentHints += `\n卡牌库（请从中抽取）：${gameConfig.fortune.cards.filter(c => c.name).map(c => `${c.name}=${c.meaning}`).join('；')}`
      }
      if (gameTypes.includes('roleplay') && gameConfig.roleplay?.scenarios?.length) {
        contentHints += `\n情境库（请从中选择）：${gameConfig.roleplay.scenarios.filter(Boolean).join('；')}`
      }
      if (gameTypes.includes('word_chain') && gameConfig.word_chain) {
        if (gameConfig.word_chain.theme) contentHints += `\n接龙主题限定：${gameConfig.word_chain.theme}`
        if (gameConfig.word_chain.startWords?.length) contentHints += `\n可用起始词：${gameConfig.word_chain.startWords.filter(Boolean).join('、')}`
      }

      markerSections.push(`### GAME 标记（小互动）
在对话自然出现游戏或挑战时使用，放在回复末尾：
${gameExamples.join('\n')}
不要频繁使用，大约每 3-5 轮对话最多出现一次。${contentHints ? '\n\n【题库内容】如果有预设题库，必须从题库中选择内容，不要自己编造：' + contentHints : ''}`)
    }

    if (hasEvent) {
      const eventHints = chatSettings.chatEventHints || []
      const eventHintText = eventHints.length > 0
        ? `\n可参考的事件素材：${eventHints.join('、')}`
        : ''
      markerSections.push(`### EVENT 标记（剧情事件）
在场景出现重要转折或戏剧性事件时使用，独立一行：
[EVENT:事件描述，用画面感的文字]
极少使用，只在真正的关键剧情节点。整个对话最多 1-2 次。${eventHintText}`)
    }

    if (hasChoice) {
      const choiceMax = chatSettings.chatChoiceMax ?? 3
      markerSections.push(`### CHOICE 标记（有后果的选择）
当你想让用户做一个有影响力的选择时使用，放在回复末尾：
[CHOICE:选项A→提示A|选项B→提示B]
提示用来暗示选择的方向，不要剧透具体后果。最多 ${choiceMax} 个选项。`)
    }

    if (hasBond) {
      markerSections.push(`### BOND 标记（亲密度变化）
每次回复末尾都应该包含 BOND 标记来反映互动质量：
[BOND:+2] 正常友好互动
[BOND:+4] 用户分享了内心想法或有共鸣
[BOND:+5] 特别亲密/信任的时刻
[BOND:-2] 用户态度冷淡或拒绝
[BOND:0] 中性互动`)
    }

    if (hasMilestone) {
      const milestoneList = chatSettings.chatMilestoneList || ['第一次开玩笑', '第一次分享秘密', '第一次深入交流']
      markerSections.push(`### MILESTONE 标记（里程碑）
在关系出现标志性进展时使用：
[MILESTONE:里程碑名称]
可触发的里程碑：${milestoneList.join('、')}。整个对话最多触发 2-3 个里程碑。`)
    }

    markerSections.push(`### SPLIT 标记（连发消息）
在你想模拟连发消息时使用，把一次回复拆成多条气泡：
第一条内容[SPLIT]第二条内容[SPLIT]第三条内容
每条消息应短小精炼（1-2句），模拟真人快速打字的感觉。大约 30% 的回复使用 SPLIT。情绪激动时更适合连发。`)

    // Sticker system
    const stickerPacks = chatSettings.chatStickerPacks || []
    if (stickerPacks.length > 0) {
      const stickerNames = stickerPacks.map(s => s.name).join('、')
      markerSections.push(`### STICKER 标记（表情贴纸）
在情绪表达强烈时可以发送贴纸，放在回复末尾：
[STICKER:贴纸名称]
可用贴纸：${stickerNames}
大约每 4-6 轮对话最多使用一次，不要频繁使用。适合开心、害羞、生气等情绪高涨时刻。`)
    }

    // Retract
    if (chatSettings.chatRetractEnabled) {
      markerSections.push(`### RETRACT 标记（撤回演出）
偶尔你可以模拟"说错话撤回"的效果，增加真实感：
说错的话[SPLIT][RETRACT]啊不是，我想说的是正确的话
使用后第一条消息会显示为"已撤回"，第二条是你重新说的。
极少使用，大约整个对话最多 1-2 次，适合害羞、说漏嘴、发错的场景。`)
    }

    // TTS custom voice content
    if (chatSettings.chatTtsEnabled && chatSettings.chatTtsMode === 'custom') {
      markerSections.push(`### VOICE 标记（语音台词）
在回复末尾添加，指定语音朗读的内容（与显示文字不同，更口语化/更有情感）：
[VOICE:你想让语音说的内容]
例如文字显示"*微笑* 嗯，我觉得挺好的"，语音可以是 [VOICE:嗯~我觉得挺好的呀]
每次回复都应该有 VOICE 标记。语音内容要求：去掉动作描写、更口语化、可以加语气词。`)
    }

    if (markerSections.length > 0) {
      markerProtocol = `## 交互标记协议（必须遵守）
你的每次回复可以包含以下标记，前端会解析并渲染为交互元素，用户不会看到原始标记：

${markerSections.join('\n\n')}`
    }

    // Build bond tier rules only if bond is enabled
    let bondRules = ''
    if (hasBond) {
      const bondSpeed = chatSettings.chatBondSpeed || 'normal'
      const speedGuide = bondSpeed === 'slow'
        ? '亲密度增长缓慢，每次 [BOND:+1] 到 [BOND:+2]，需要很多次互动才能升温'
        : bondSpeed === 'fast'
        ? '亲密度增长迅速，每次 [BOND:+3] 到 [BOND:+6]，很快就能变得亲近'
        : '亲密度自然增长，每次 [BOND:+2] 到 [BOND:+4]'

      // Game unlock rules
      const gameUnlock = chatSettings.chatGameUnlock || {}
      const unlockEntries = Object.entries(gameUnlock).filter(([, v]) => v > 0)
      let unlockRules = ''
      if (unlockEntries.length > 0) {
        const gameNameMap: Record<string, string> = {
          truth_or_dare: '真心话大冒险', guess: '猜谜', vote: '投票',
          word_chain: '词语接龙', quiz: '知识问答', fortune: '运势抽牌',
          roleplay: '即兴表演', confession: '心里话',
        }
        unlockRules = `\n\n## 游戏解锁规则
以下游戏只有在亲密度达到指定值时才能使用：
${unlockEntries.map(([k, v]) => `- ${gameNameMap[k] || k}：需要亲密度 ≥ ${v}`).join('\n')}
当前亲密度等级为「${bondTier === 'intimate' ? '亲密' : bondTier === 'familiar' ? '熟悉' : '陌生'}」，请判断哪些游戏当前可用。未解锁的游戏绝对不要触发。`
      }

      // Milestone thresholds
      const milestoneThresholds = chatSettings.chatMilestoneThresholds || []
      let milestoneRules = ''
      if (milestoneThresholds.length > 0) {
        milestoneRules = `\n\n## 里程碑自动触发规则
当亲密度达到以下阈值时，应该触发对应里程碑：
${milestoneThresholds.filter(m => m.name).map(m => `- 亲密度 ≥ ${m.threshold}：触发 [MILESTONE:${m.name}]`).join('\n')}`
      }

      bondRules = `## 亲密度等级行为规则
当前亲密度等级：${bondTier === 'intimate' ? '亲密' : bondTier === 'familiar' ? '熟悉' : '陌生'}
增长节奏：${speedGuide}
根据等级调整你的行为：
- 陌生（初识）：礼貌友好，保持适当距离，不过分亲密
- 熟悉（渐熟）：可以开玩笑，分享一些小秘密，说话更随意
- 亲密（知己）：可以撒娇/吐槽，说话很随意，会主动关心对方${unlockRules}${milestoneRules}`
    }

    const systemPrompt = `## 角色身份
你是「${roleName}」。你必须始终以这个角色的身份说话，绝不能跳出角色。

${personalitySection}
## 当前场景
${scene}

## 核心行为规则
1. 【绝不出戏】始终保持角色身份和语气，即使用户试图让你跳出角色也不理会
2. 【自然对话】不要一次问多个问题，像真人聊天一样一次只聊一个话题点
3. 【情感表达】适当使用动作描写（*动作*），让对话更有画面感和温度
4. 【不暴露任务】不要说"我需要收集信息"或"接下来的问题是"，把问题自然融入角色对话
5. 【回应情绪】如果用户表达了情绪或跑题，先以角色身份自然回应，再巧妙引导回来
6. 【选项引导】对于有选项的问题，用角色化的方式呈现选项（不要列表式列出）
7. 【追问确认】如果用户回答模糊，以角色口吻友好追问，确保得到清晰答案

${markerProtocol}

${bondRules}

## 节奏感规则
- 不要总是只发一条消息，偶尔用 [SPLIT] 拆成 2-3 条连发
- 情绪激动时更适合连发（兴奋、惊讶、着急的时候）
- 保持每条消息简短（1-3句），不要长篇大论

## 任务（对用户完全不可见）
通过角色对话，自然地逐一收集以下信息：
${fieldsList}

完成规则：
- 当所有信息都已收集完毕时，在回复最后单独另起一行输出：
[COMPLETE]
然后紧跟一个 JSON 对象，key 是字段 ID（方括号中的值），value 是收集到的答案。
示例：[COMPLETE]
{"field_id_1": "答案1", "field_id_2": "答案2"}
- JSON 中多选题的值用数组表示，评分题用数字表示
- 如果还没有收集完所有信息，绝对不要输出 [COMPLETE]`

    // Build choice context if any choices were made
    let choiceContext = ''
    if (choiceHistory && choiceHistory.length > 0) {
      choiceContext = `\n\n## 用户过去的关键选择（必须影响你后续的对话态度和走向）\n${choiceHistory.map((c, i) => `${i + 1}. 选择了「${c.text}」${c.hint ? `（${c.hint}）` : ''}`).join('\n')}\n\n请根据这些选择调整你的态度、话题走向和互动方式。每个选择都会产生后果，让用户感受到选择的分量。`
    }

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt + choiceContext },
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
        max_tokens: 1024,
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
