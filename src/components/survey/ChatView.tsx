'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { parseMarkers, getSceneGradient, MOOD_MAP, MoodType, GameData, ChoiceOption } from '@/lib/marker-parser'
import { ChatHeader } from './chat/ChatHeader'
import { ChatBubble } from './chat/ChatBubble'
import { GameCard } from './chat/GameCard'
import { ChoiceCards } from './chat/ChoiceCards'
import { ChatOverlays } from './chat/ChatOverlays'
import { ChatInput } from './chat/ChatInput'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  mood?: MoodType
  moodIntensity?: number
  scene?: string
  suggests?: string[]
  game?: GameData
  event?: string
  choice?: ChoiceOption[]
  bond?: number
  milestone?: string
  isChoice?: boolean
  sticker?: string
  isRetracted?: boolean
}

interface ChatViewProps {
  fields: SurveyField[]
  answers: Record<string, unknown>
  setAnswers: (a: Record<string, unknown>) => void
  onSubmit: () => void
  submitting: boolean
  title: string
  description: string
  theme: ThemeSettings
  chatRole?: string
  chatScene?: string
  chatOpening?: string
  chatPersonality?: string
  chatTone?: string
  chatHabit?: string
  chatBackground?: string
  chatAvatarStyle?: string
  chatAvatarUrl?: string
  chatAvatarMoodUrls?: Record<string, string>
  chatInitialScene?: string
  chatBondStart?: number
  chatBondTierNames?: string[]
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
  chatGameConfig?: Record<string, unknown>
  chatBondSpeed?: 'slow' | 'normal' | 'fast'
  chatGameUnlock?: Record<string, number>
  chatMilestoneThresholds?: { name: string; threshold: number }[]
  chatScenePresets?: { keyword: string; gradient: string }[]
  chatStickerPacks?: { name: string; url: string }[]
  chatTtsEnabled?: boolean
  chatTtsVoice?: string
  chatTtsMode?: 'auto' | 'custom' | 'keyword'
  chatVoiceTriggers?: { keyword: string; reply: string }[]
  chatTypingEnabled?: boolean
  chatRetractEnabled?: boolean
  surveyId: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatView({
  fields,
  answers,
  setAnswers,
  onSubmit,
  submitting,
  title,
  theme,
  chatRole,
  chatScene,
  chatOpening,
  chatPersonality,
  chatTone,
  chatHabit,
  chatBackground,
  chatAvatarStyle,
  chatAvatarUrl,
  chatAvatarMoodUrls,
  chatInitialScene,
  chatBondStart,
  chatBondTierNames,
  chatFeatures,
  chatMoodList,
  chatGameTypes,
  chatSuggestCount,
  chatChoiceMax,
  chatMilestoneList,
  chatEventHints,
  chatGameConfig,
  chatBondSpeed,
  chatGameUnlock,
  chatMilestoneThresholds,
  chatScenePresets,
  chatStickerPacks,
  chatTtsEnabled,
  chatTtsVoice,
  chatTtsMode,
  chatVoiceTriggers,
  chatTypingEnabled,
  chatRetractEnabled,
  surveyId,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')
  const [currentMood, setCurrentMood] = useState<MoodType>('neutral')
  const [currentMoodIntensity, setCurrentMoodIntensity] = useState(3)
  const [sceneGradient, setSceneGradient] = useState<string>(theme.backgroundGradient || '#f0ebf8')
  const [isDarkScene, setIsDarkScene] = useState(false)
  const [showSceneBar, setShowSceneBar] = useState(false)
  const [sceneBarText, setSceneBarText] = useState('')
  const [showSceneOverlay, setShowSceneOverlay] = useState(false)
  const [typingDelay, setTypingDelay] = useState(false)
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [bondLevel, setBondLevel] = useState(chatBondStart ?? 20)
  const [bondDelta, setBondDelta] = useState<number | null>(null)
  const [showMilestone, setShowMilestone] = useState<string | null>(null)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [choiceHistory, setChoiceHistory] = useState<{ text: string; hint: string }[]>([])
  const [milestonesAchieved, setMilestonesAchieved] = useState<string[]>([])
  const [bondStart] = useState(chatBondStart ?? 20)
  const [showRecap, setShowRecap] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const roleName = chatRole || '问卷助手'
  const avatarStyle = chatAvatarStyle || 'avataaars'
  const answerableFields = fields.filter(f => f.type !== 'section')
  const bondTier = bondLevel < 30 ? 'stranger' : bondLevel < 60 ? 'familiar' : 'intimate'
  const moodData = MOOD_MAP[currentMood]
  const bubbleAnimation = moodData.bubbleClass || 'animate-chatSlideLeft'

  // ─── Avatar ─────────────────────────────────────────────────────────────────

  const getAvatarForMood = (mood: MoodType) => {
    if (chatAvatarMoodUrls && chatAvatarMoodUrls[mood]) return chatAvatarMoodUrls[mood]
    if (chatAvatarUrl) return chatAvatarUrl
    const moodSeedMap: Record<MoodType, string> = {
      happy: `${roleName}-happy`,
      excited: `${roleName}-excited`,
      thinking: `${roleName}-thinking`,
      sad: `${roleName}-sad`,
      shy: `${roleName}-shy`,
      angry: `${roleName}-angry`,
      neutral: roleName,
    }
    const moodOptions: Record<MoodType, string> = {
      happy: '&mouth=smile&eyes=happy',
      excited: '&mouth=smile&eyes=surprised',
      thinking: '&mouth=serious&eyes=squint',
      sad: '&mouth=sad&eyes=cry',
      shy: '&mouth=smile&eyes=side',
      angry: '&mouth=screamOpen&eyes=angry',
      neutral: '',
    }
    return `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(moodSeedMap[mood])}&size=80${moodOptions[mood]}`
  }

  const avatarUrl = getAvatarForMood(currentMood)

  // ─── TTS (Edge TTS via server) ──────────────────────────────────────────────

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speakText = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return
    const clean = text.replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim()
    if (!clean) return
    // Stop previous audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 500), voice: chatTtsVoice || '晓晓' }),
      })
      if (!resp.ok) return
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {}
  }, [chatTtsVoice])

  const getKeywordVoiceReply = useCallback((msgContent: string): string | null => {
    if (!chatVoiceTriggers || chatVoiceTriggers.length === 0) return null
    for (const trigger of chatVoiceTriggers) {
      if (trigger.keyword && msgContent.includes(trigger.keyword)) {
        return trigger.reply
      }
    }
    return null
  }, [chatVoiceTriggers])

  // ─── Scene & Bond handlers ──────────────────────────────────────────────────

  const handleSceneChange = (scene: string) => {
    let matched = false
    if (chatScenePresets && chatScenePresets.length > 0) {
      const preset = chatScenePresets.find(p => scene.includes(p.keyword))
      if (preset) {
        setShowSceneOverlay(true)
        setTimeout(() => { setSceneGradient(preset.gradient); setIsDarkScene(false) }, 300)
        setTimeout(() => setShowSceneOverlay(false), 600)
        matched = true
      }
    }
    if (!matched) {
      const themeData = getSceneGradient(scene)
      if (themeData) {
        setShowSceneOverlay(true)
        setTimeout(() => { setSceneGradient(themeData.gradient); setIsDarkScene(themeData.isDark) }, 300)
        setTimeout(() => setShowSceneOverlay(false), 600)
      }
    }
    setSceneBarText(scene)
    setShowSceneBar(true)
    setTimeout(() => setShowSceneBar(false), 2500)
  }

  const handleBondChange = (delta: number) => {
    setBondLevel(prev => Math.max(0, Math.min(100, prev + delta)))
    setBondDelta(delta)
    setTimeout(() => setBondDelta(null), 1200)
  }

  const handleMilestone = (name: string) => {
    setShowMilestone(name)
    setMilestonesAchieved(prev => prev.includes(name) ? prev : [...prev, name])
    setBondLevel(prev => Math.min(100, prev + 5))
    setTimeout(() => setShowMilestone(null), 2000)
  }

  // ─── API ────────────────────────────────────────────────────────────────────

  const sendToApi = async (chatHistory: ChatMessage[]) => {
    setStreaming(true)
    setError('')
    setTypingDelay(true)
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
    setTypingDelay(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
          fields: fields.map(f => ({ id: f.id, label: f.label, type: f.type, options: f.options })),
          bondTier,
          choiceHistory: choiceHistory.length > 0 ? choiceHistory : undefined,
          chatSettings: { chatRole, chatScene: chatScene || '', chatOpening, chatPersonality, chatTone, chatHabit, chatBackground, chatFeatures, chatMoodList, chatGameTypes, chatSuggestCount, chatChoiceMax, chatMilestoneList, chatEventHints, chatGameConfig, chatBondSpeed, chatGameUnlock, chatMilestoneThresholds, chatStickerPacks, chatRetractEnabled, chatTtsEnabled, chatTtsMode },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '请求失败' }))
        setError((err as { error?: string }).error || '请求失败')
        setStreaming(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) { setStreaming(false); return }

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              const displayed = fullContent
                .replace(/\[MOOD:[^\]]*\]/g, '')
                .replace(/\[SCENE:[^\]]*\]/g, '')
                .replace(/\[SUGGEST:[^\]]*\]/g, '')
                .replace(/\[SPLIT\]/g, '')
                .replace(/\[GAME:[^\]]*\]/g, '')
                .replace(/\[EVENT:[^\]]*\]/g, '')
                .replace(/\[CHOICE:[^\]]*\]/g, '')
                .replace(/\[BOND:[^\]]*\]/g, '')
                .replace(/\[MILESTONE:[^\]]*\]/g, '')
                .replace(/\[STICKER:[^\]]*\]/g, '')
                .replace(/\[RETRACT\]/g, '')
                .replace(/\[VOICE:[^\]]*\]/g, '')
                .trim()
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: displayed }
                return updated
              })
            }
          } catch { /* skip */ }
        }
      }

      // Parse final content
      const parsed = parseMarkers(fullContent)

      // Handle [COMPLETE]
      const completeSegmentIdx = parsed.segments.findIndex(s => s.includes('[COMPLETE]'))
      if (completeSegmentIdx !== -1) {
        setCompleted(true)
        const completeSegment = parsed.segments[completeSegmentIdx]
        const completeParts = completeSegment.split('[COMPLETE]')
        const jsonStr = completeParts[1]?.trim()
        if (jsonStr) {
          try {
            const extractedAnswers = JSON.parse(jsonStr)
            setAnswers(extractedAnswers)
            setShowRecap(true)
            setTimeout(() => onSubmit(), 4000)
          } catch {}
        }
        parsed.segments[completeSegmentIdx] = completeParts[0].trim()
      }

      const newMessages: ChatMessage[] = parsed.segments
        .filter(s => s.length > 0)
        .map((seg, i) => ({
          role: 'assistant' as const,
          content: seg,
          mood: i === 0 ? parsed.mood : undefined,
          moodIntensity: i === 0 ? parsed.moodIntensity : undefined,
          scene: i === 0 ? parsed.scene : undefined,
          suggests: i === parsed.segments.length - 1 ? parsed.suggests : undefined,
          game: i === parsed.segments.length - 1 ? parsed.game : undefined,
          choice: i === parsed.segments.length - 1 ? parsed.choice : undefined,
          bond: i === parsed.segments.length - 1 ? parsed.bond : undefined,
          milestone: i === parsed.segments.length - 1 ? parsed.milestone : undefined,
          event: i === parsed.segments.length - 1 ? parsed.event : undefined,
          sticker: i === parsed.segments.length - 1 ? parsed.sticker : undefined,
        }))

      if (parsed.retract && chatRetractEnabled && newMessages.length > 1) {
        newMessages[0] = { ...newMessages[0], isRetracted: true }
      }

      // Staggered display
      setMessages(prev => {
        const withoutPlaceholder = prev.slice(0, -1)
        if (chatTypingEnabled && newMessages.length > 1) {
          return [...withoutPlaceholder, newMessages[0]]
        }
        return [...withoutPlaceholder, ...newMessages]
      })

      if (chatTypingEnabled && newMessages.length > 1) {
        for (let i = 1; i < newMessages.length; i++) {
          await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
          setMessages(prev => [...prev, newMessages[i]])
        }
      }

      // Side effects
      if (parsed.mood) { setCurrentMood(parsed.mood); setCurrentMoodIntensity(parsed.moodIntensity || 3) }
      if (parsed.scene) handleSceneChange(parsed.scene)
      if (parsed.bond) handleBondChange(parsed.bond)
      if (parsed.milestone) handleMilestone(parsed.milestone)
      if (parsed.event) setActiveEvent(parsed.event)

      // TTS
      if (chatTtsEnabled && newMessages.length > 0) {
        let textToSpeak: string | null = null
        if (chatTtsMode === 'keyword') {
          textToSpeak = getKeywordVoiceReply(newMessages.map(m => m.content).join(''))
        } else if (chatTtsMode === 'custom' && parsed.voice) {
          textToSpeak = parsed.voice
        } else {
          textToSpeak = newMessages.map(m => m.content).join('。')
        }
        if (textToSpeak) speakText(textToSpeak)
      }

      setCurrentFieldIndex(prev => Math.min(prev + 1, answerableFields.length - 1))
    } catch {
      setError('网络错误，请重试')
    } finally {
      setStreaming(false)
    }
  }

  // ─── Message handlers ───────────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || streaming || completed) return
    const userMessage: ChatMessage = { role: 'user', content: msg }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    await sendToApi(newMessages)
  }

  const handleChoiceSelect = (text: string, hint: string) => {
    setChoiceHistory(prev => [...prev, { text, hint }])
    const userMessage: ChatMessage = { role: 'user', content: text, isChoice: true }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    sendToApi(newMessages)
  }

  // ─── Computed values ────────────────────────────────────────────────────────

  const getFieldOptions = useCallback((): string[] | null => {
    const field = answerableFields[currentFieldIndex]
    if (!field) return null
    if (field.options && field.options.length > 0 && ['radio', 'checkbox', 'select'].includes(field.type)) {
      return field.options
    }
    return null
  }, [answerableFields, currentFieldIndex])

  const getQuickReplies = (): string[] | null => {
    if (streaming || completed) return null
    const fieldOpts = getFieldOptions()
    if (fieldOpts) return fieldOpts
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.suggests && lastMsg.suggests.length > 0) {
      return lastMsg.suggests
    }
    return null
  }

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const quickReplies = getQuickReplies()
  const activeGame = !streaming && !completed ? lastAssistantMsg?.game : null
  const activeChoice = !streaming && !completed ? lastAssistantMsg?.choice : null

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initialScene = chatInitialScene || chatScene
    if (initialScene) handleSceneChange(initialScene)
    if (chatOpening) {
      const parsed = parseMarkers(chatOpening)
      const firstSegment = parsed.segments[0] || chatOpening
      setMessages([{ role: 'assistant', content: firstSegment, mood: parsed.mood, moodIntensity: parsed.moodIntensity, scene: parsed.scene, suggests: parsed.suggests }])
      if (parsed.mood) { setCurrentMood(parsed.mood); setCurrentMoodIntensity(parsed.moodIntensity || 3) }
      if (parsed.scene) handleSceneChange(parsed.scene)
    } else {
      sendToApi([])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] flex flex-col scene-transition relative overflow-hidden" style={{ background: sceneGradient }}>
      <ChatOverlays
        showSceneOverlay={showSceneOverlay}
        showSceneBar={showSceneBar}
        sceneBarText={sceneBarText}
        activeEvent={activeEvent}
        onDismissEvent={() => setActiveEvent(null)}
        showMilestone={showMilestone}
        showRecap={showRecap}
        bondStart={bondStart}
        bondLevel={bondLevel}
        bondTier={bondTier}
        bondTierNames={chatBondTierNames}
        milestonesAchieved={milestonesAchieved}
        choiceHistory={choiceHistory}
        messageCount={messages.filter(m => m.role === 'user').length}
        submitting={submitting}
        theme={theme}
      />

      <ChatHeader
        avatarUrl={avatarUrl}
        roleName={roleName}
        currentMood={currentMood}
        currentMoodIntensity={currentMoodIntensity}
        bondLevel={bondLevel}
        bondTier={bondTier}
        bondDelta={bondDelta}
        bondTierNames={chatBondTierNames}
        chatPersonality={chatPersonality}
        isDarkScene={isDarkScene}
        theme={theme}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.map((msg, idx) => (
            <ChatBubble
              key={idx}
              content={msg.content}
              role={msg.role}
              mood={msg.mood}
              isRetracted={msg.isRetracted}
              isChoice={msg.isChoice}
              sticker={msg.sticker}
              stickerPacks={chatStickerPacks}
              roleName={roleName}
              avatarUrl={getAvatarForMood(msg.mood || 'neutral')}
              isDarkScene={isDarkScene}
              ttsEnabled={chatTtsEnabled}
              onSpeak={speakText}
              bubbleAnimation={bubbleAnimation}
            />
          ))}

          {typingDelay && (
            <div className="flex justify-start animate-chatSlideLeft">
              <div className="relative flex-shrink-0 mr-2 mt-1">
                <img src={avatarUrl} alt={roleName} className="w-8 h-8 rounded-full bg-gray-100 shadow-sm" />
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-sm rounded-bl-md ${isDarkScene ? 'bg-white/10 border border-white/10' : 'bg-white shadow-sm border border-gray-100'}`}>
                <div className="flex items-center gap-2 animate-typingBreath">
                  <span className="text-xs text-gray-400">{roleName}正在输入</span>
                  <span className={`animate-cursorBlink ${isDarkScene ? 'text-gray-300' : 'text-gray-500'}`}>|</span>
                </div>
              </div>
            </div>
          )}

          {completed && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {submitting ? '提交中...' : '对话完成，正在提交...'}
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-2">
              <span className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">{error}</span>
              <button
                onClick={() => { setError(''); sendToApi(messages) }}
                className="block mx-auto mt-2 text-xs px-4 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                重试
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {activeGame && (
        <GameCard game={activeGame} isDarkScene={isDarkScene} theme={theme} onSend={handleSend} />
      )}

      {activeChoice && (
        <ChoiceCards choices={activeChoice} isDarkScene={isDarkScene} theme={theme} onSelect={handleChoiceSelect} />
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        streaming={streaming}
        completed={completed}
        isDarkScene={isDarkScene}
        roleName={roleName}
        theme={theme}
        quickReplies={!activeGame && !activeChoice ? quickReplies : null}
      />
    </div>
  )
}
