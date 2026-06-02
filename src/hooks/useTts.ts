'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseTtsOptions {
  enabled?: boolean
  voice?: string
  mode?: 'auto' | 'custom' | 'keyword'
  voiceTriggers?: { keyword: string; reply: string }[]
}

export function useTts({ enabled, voice, mode, voiceTriggers }: UseTtsOptions) {
  const [speaking, setSpeaking] = useState(false)

  // Preload voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.getVoices()
    const handler = () => { window.speechSynthesis.getVoices() }
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [])

  const speakText = useCallback((text: string) => {
    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return
    const clean = text.replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim()
    if (!clean) return
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.pitch = 1.1
    if (voice) {
      const voices = window.speechSynthesis.getVoices()
      const match = voices.find(v => v.name.includes(voice))
      if (match) utterance.voice = match
    }
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [enabled, voice])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  // Get keyword voice reply if content matches a trigger
  const getKeywordVoiceReply = useCallback((msgContent: string): string | null => {
    if (!voiceTriggers || voiceTriggers.length === 0) return null
    for (const trigger of voiceTriggers) {
      if (trigger.keyword && msgContent.includes(trigger.keyword)) {
        return trigger.reply
      }
    }
    return null
  }, [voiceTriggers])

  // Determine what to speak based on mode
  const speakForMessage = useCallback((content: string, voiceMarker?: string) => {
    if (!enabled) return
    let textToSpeak: string | null = null
    if (mode === 'keyword') {
      textToSpeak = getKeywordVoiceReply(content)
    } else if (mode === 'custom' && voiceMarker) {
      textToSpeak = voiceMarker
    } else {
      textToSpeak = content
    }
    if (textToSpeak) speakText(textToSpeak)
  }, [enabled, mode, getKeywordVoiceReply, speakText])

  return { speakText, speakForMessage, stop, speaking }
}
