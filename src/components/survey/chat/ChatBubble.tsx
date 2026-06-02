'use client'

import { MoodType, MOOD_MAP } from '@/lib/marker-parser'

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
}: ChatBubbleProps) {
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

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} ${
      role === 'user' ? 'animate-chatSlideRight' : bubbleAnimation
    }`}>
      {role === 'assistant' && (
        <div className="relative flex-shrink-0 mr-2 mt-1">
          <img
            src={avatarUrl}
            alt={roleName}
            className="w-9 h-9 rounded-full bg-gray-100 shadow-sm transition-all duration-300"
            style={{
              border: mood && mood !== 'neutral' ? `2px solid ${MOOD_MAP[mood].color}` : '1.5px solid #e5e7eb',
            }}
          />
          {mood && mood !== 'neutral' && MOOD_MAP[mood].emoji && (
            <span className="absolute -bottom-0.5 -right-0.5 text-xs bg-white rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">{MOOD_MAP[mood].emoji}</span>
          )}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
          role === 'assistant' ? renderContent(content) : content
        ) : (
          <div className="flex items-center gap-2 animate-typingBreath">
            <span className="text-xs text-gray-400">{roleName}正在输入</span>
            <span className={`animate-cursorBlink ${isDarkScene ? 'text-gray-300' : 'text-gray-500'}`}>|</span>
          </div>
        )}
        {isChoice && (
          <span className="block mt-1 text-[10px] text-indigo-200 opacity-80">⚡ 你做出了选择</span>
        )}
        {ttsEnabled && role === 'assistant' && content && !isRetracted && (
          <button
            onClick={(e) => { e.stopPropagation(); onSpeak?.(content) }}
            className={`inline-flex items-center mt-1 text-[10px] gap-0.5 opacity-50 hover:opacity-100 transition-opacity ${isDarkScene ? 'text-gray-300' : 'text-gray-400'}`}
          >
            🔊
          </button>
        )}
      </div>
    </div>
  )
}
