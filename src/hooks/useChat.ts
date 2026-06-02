'use client'

import { useState, useRef, useCallback } from 'react'
import { SurveyField } from '@/lib/types'
import { parseMarkers, MoodType, GameData, ChoiceOption } from '@/lib/marker-parser'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
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

interface ChatSettings {
  chatRole?: string
  chatScene?: string
  chatOpening?: string
  chatPersonality?: string
  chatTone?: string
  chatHabit?: string
  chatBackground?: string
  chatFeatures?: Record<string, boolean>
  chatMoodList?: { name: string; emoji: string }[]
  chatGameTypes?: string[]
  chatSuggestCount?: number
  chatChoiceMax?: number
  chatMilestoneList?: string[]
  chatEventHints?: string[]
  chatGameConfig?: Record<string, unknown>
  chatBondSpeed?: string
  chatGameUnlock?: Record<string, number>
  chatMilestoneThresholds?: { name: string; threshold: number }[]
  chatStickerPacks?: { name: string; url: string }[]
  chatRetractEnabled?: boolean
  chatTtsEnabled?: boolean
  chatTtsMode?: string
}

interface UseChatOptions {
  surveyId: string
  fields: SurveyField[]
  settings: ChatSettings
  typingEnabled?: boolean
  retractEnabled?: boolean
  onMoodChange?: (mood: MoodType, intensity: number) => void
  onSceneChange?: (scene: string) => void
  onBondChange?: (delta: number) => void
  onMilestone?: (name: string) => void
  onEvent?: (event: string) => void
  onComplete?: (answers: Record<string, unknown>) => void
  onVoice?: (content: string, voiceMarker?: string) => void
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChat({
  surveyId,
  fields,
  settings,
  typingEnabled = true,
  retractEnabled = false,
  onMoodChange,
  onSceneChange,
  onBondChange,
  onMilestone,
  onEvent,
  onComplete,
  onVoice,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [typingDelay, setTypingDelay] = useState(false)
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [choiceHistory, setChoiceHistory] = useState<{ text: string; hint: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const answerableFields = fields.filter(f => f.type !== 'section')
  const bondTier = 'stranger' // Will be overridden by external bond state

  const sendToApi = useCallback(async (chatHistory: ChatMessage[], bondTierOverride?: string) => {
    setStreaming(true)
    setError('')
    setTypingDelay(true)
    const delay = 300 + Math.random() * 500
    await new Promise(r => setTimeout(r, delay))
    setTypingDelay(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
          fields: fields.map(f => ({ id: f.id, label: f.label, type: f.type, options: f.options })),
          bondTier: bondTierOverride || bondTier,
          choiceHistory: choiceHistory.length > 0 ? choiceHistory : undefined,
          chatSettings: settings,
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

      // Add placeholder message for streaming
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
            onComplete?.(extractedAnswers)
          } catch {}
        }
        parsed.segments[completeSegmentIdx] = completeParts[0].trim()
      }

      // Build final messages
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

      // Handle retract
      if (parsed.retract && retractEnabled && newMessages.length > 1) {
        newMessages[0] = { ...newMessages[0], isRetracted: true }
      }

      // Show messages with staggered typing delay
      setMessages(prev => {
        const withoutPlaceholder = prev.slice(0, -1)
        if (typingEnabled && newMessages.length > 1) {
          // Will be handled below with sequential updates
          return [...withoutPlaceholder, newMessages[0]]
        }
        return [...withoutPlaceholder, ...newMessages]
      })

      // Staggered display for SPLIT messages
      if (typingEnabled && newMessages.length > 1) {
        for (let i = 1; i < newMessages.length; i++) {
          await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
          setMessages(prev => [...prev, newMessages[i]])
        }
      }

      // Fire side-effect callbacks
      if (parsed.mood) onMoodChange?.(parsed.mood, parsed.moodIntensity || 3)
      if (parsed.scene) onSceneChange?.(parsed.scene)
      if (parsed.bond) onBondChange?.(parsed.bond)
      if (parsed.milestone) onMilestone?.(parsed.milestone)
      if (parsed.event) onEvent?.(parsed.event)

      // TTS
      if (newMessages.length > 0) {
        const textContent = newMessages.map(m => m.content).join('。')
        onVoice?.(textContent, parsed.voice)
      }

      setCurrentFieldIndex(prev => Math.min(prev + 1, answerableFields.length - 1))
    } catch {
      setError('网络错误，请重试')
    } finally {
      setStreaming(false)
    }
  }, [surveyId, fields, settings, choiceHistory, bondTier, typingEnabled, retractEnabled, answerableFields.length, onMoodChange, onSceneChange, onBondChange, onMilestone, onEvent, onComplete, onVoice])

  const sendMessage = useCallback(async (text: string, bondTierOverride?: string) => {
    if (!text || streaming || completed) return
    const userMessage: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    await sendToApi(newMessages, bondTierOverride)
  }, [messages, streaming, completed, sendToApi])

  const sendChoice = useCallback(async (text: string, hint: string, bondTierOverride?: string) => {
    if (streaming || completed) return
    setChoiceHistory(prev => [...prev, { text, hint }])
    const userMessage: ChatMessage = { role: 'user', content: text, isChoice: true }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    await sendToApi(newMessages, bondTierOverride)
  }, [messages, streaming, completed, sendToApi])

  const retry = useCallback(() => {
    setError('')
    sendToApi(messages)
  }, [messages, sendToApi])

  const getFieldOptions = useCallback((): string[] | null => {
    const field = answerableFields[currentFieldIndex]
    if (!field) return null
    if (field.options && field.options.length > 0 && ['radio', 'checkbox', 'select'].includes(field.type)) {
      return field.options
    }
    return null
  }, [answerableFields, currentFieldIndex])

  return {
    messages,
    setMessages,
    streaming,
    error,
    completed,
    typingDelay,
    currentFieldIndex,
    messagesEndRef,
    sendMessage,
    sendChoice,
    sendToApi,
    retry,
    getFieldOptions,
  }
}
