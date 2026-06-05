'use client'

import { useState, useRef } from 'react'
import { MoodType, MOOD_MAP } from '@/lib/marker-parser'
import { Zap, Volume2 } from 'lucide-react'

interface ChatBubbleProps {
  content: string
  role: 'user' | 'assistant'
  mood?: MoodType
  isRetracted?: boolean
  isChoice?: boolean
  sticker?: string
  stickerPacks?: { name: string; url: string }[]
  roleName: string
  avatarUrl: string
  isDarkScene: boolean
  ttsEnabled?: boolean
  onSpeak?: (text: string) => void
  bubbleAnimation: string
  isGrouped?: boolean
  isStreaming?: boolean
}

export function ChatBubble({
  content,
  role,
  mood,
  isRetracted,
  isChoice,
  sticker,
  stickerPacks,
  roleName,
  avatarUrl,
  isDarkScene,
  ttsEnabled,
  onSpeak,
  bubbleAnimation,
  isGrouped,
  isStreaming,
}: ChatBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [timestamp] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (ttsEnabled && role === 'assistant' && content && !isRetracted) {
        onSpeak?.(content)
      }
      setShowTimestamp(true)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const renderContent = (text: string) => {
    if (!text) return null
    const parts = text.split(/(\*[^*]+\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="not-italic text-xs block my-1 text-gray-400">{part.slice(1, -1)}</em>
      }
      return <span key={i}>{part}</span>
    })
  }

  const renderAvatar = () => {
    if (avatarError) {
      return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium shadow-sm">
          {roleName.charAt(0)}
        </div>
      )
    }
    return (
      <img
        src={avatarUrl}
        alt={roleName}
        className="w-9 h-9 rounded-full bg-gray-100 shadow-sm transition-all duration-300"
        style={{
          border: mood && mood !== 'neutral' ? `2px solid ${MOOD_MAP[mood].color}` : '1.5px solid #e5e7eb',
        }}
        onError={() => setAvatarError(true)}
      />
    )
  }

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} ${
        role === 'user' ? 'animate-chatSlideRight' : bubbleAnimation
      } ${isGrouped ? 'mt-1' : 'mt-3'}`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {role === 'assistant' && (
        <div className={`relative flex-shrink-0 mr-2 mt-1 ${isGrouped ? 'invisible' : ''}`}>
          {renderAvatar()}
          {mood && mood !== 'neutral' && MOOD_MAP[mood].emoji && (
            <span className="absolute -bottom-0.5 -right-0.5 text-xs bg-white rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">{MOOD_MAP[mood].emoji}</span>
          )}
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            role === 'user'
              ? 'bg-indigo-600 text-white rounded-br-md'
              : isRetracted
                ? 'bg-gray-100 text-gray-400 rounded-bl-md line-through italic text-xs'
                : isDarkScene
                  ? 'bg-white/10 text-white shadow-sm border border-white/10 rounded-bl-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
          }`}
        >
          {isRetracted ? (
            <span className="text-xs text-gray-400">此消息已撤回</span>
          ) : sticker ? (
            <div className="py-1">
              {(() => {
                const stickerData = stickerPacks?.find(s => s.name === sticker)
                return stickerData ? (
                  <img src={stickerData.url} alt={sticker} className="w-24 h-24 object-contain" />
                ) : (
                  <span className="text-2xl">{sticker}</span>
                )
              })()}
              {content && (role === 'assistant' ? renderContent(content) : content)}
            </div>
          ) : content ? (
            <>
              {role === 'assistant' ? renderContent(content) : content}
              {isStreaming && <span className="inline-block ml-0.5 animate-cursorBlink text-gray-400">▎</span>}
            </>
          ) : (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-typingDot" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-typingDot" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-typingDot" style={{ animationDelay: '400ms' }} />
            </div>
          )}
          {isChoice && (
            <span className="flex items-center gap-0.5 mt-1 text-[10px] text-indigo-200 opacity-80"><Zap className="w-2.5 h-2.5" /> 你做出了选择</span>
          )}
        </div>
        {/* TTS button */}
        {ttsEnabled && role === 'assistant' && content && !isRetracted && !isStreaming && (
          <button
            onClick={(e) => { e.stopPropagation(); onSpeak?.(content) }}
            className={`self-start mt-0.5 text-[10px] opacity-40 hover:opacity-100 transition-opacity ${isDarkScene ? 'text-gray-300' : 'text-gray-400'}`}
          >
            <span className="flex items-center gap-0.5"><Volume2 className="w-2.5 h-2.5" /> 播放</span>
          </button>
        )}
        {/* Timestamp */}
        <span className={`text-[10px] mt-0.5 transition-opacity duration-200 ${
          role === 'user' ? 'text-right' : 'text-left'
        } ${showTimestamp ? 'opacity-60' : 'opacity-0'} ${isDarkScene ? 'text-gray-300' : 'text-gray-400'}`}>
          {timestamp}
        </span>
      </div>
    </div>
  )
}
