'use client'

import { useRef } from 'react'
import { ThemeSettings } from '@/lib/types'

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  onSend: (text?: string) => void
  streaming: boolean
  completed: boolean
  isDarkScene: boolean
  roleName: string
  theme: ThemeSettings
  quickReplies?: string[] | null
}

export function ChatInput({
  input,
  setInput,
  onSend,
  streaming,
  completed,
  isDarkScene,
  roleName,
  theme,
  quickReplies,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {/* Quick reply buttons */}
      {quickReplies && quickReplies.length > 0 && (
        <div className={`flex-shrink-0 px-4 py-2 border-t ${isDarkScene ? 'bg-black/20 border-white/10' : 'bg-white/60 border-gray-100'}`}>
          <div className="max-w-lg mx-auto flex flex-wrap gap-2">
            {quickReplies.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSend(opt)}
                className="animate-suggestSlideUp text-sm px-4 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95"
                style={{
                  animationDelay: `${i * 50}ms`,
                  borderColor: theme.primaryColor,
                  color: isDarkScene ? '#fff' : theme.primaryColor,
                  backgroundColor: isDarkScene ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primaryColor
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkScene ? 'rgba(255,255,255,0.1)' : 'transparent'
                  e.currentTarget.style.color = isDarkScene ? '#fff' : theme.primaryColor
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className={`flex-shrink-0 backdrop-blur-sm border-t px-4 py-3 safe-area-bottom ${isDarkScene ? 'bg-black/30 border-white/10' : 'bg-white/90 border-gray-100'}`}>
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
            placeholder={completed ? '对话已结束' : streaming ? `${roleName}正在回复...` : '输入消息...'}
            disabled={streaming || completed}
            className={`flex-1 h-10 px-4 rounded-full border text-sm focus:outline-none transition-colors disabled:opacity-50 ${
              isDarkScene
                ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-white/40'
                : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-300 focus:bg-white'
            }`}
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || streaming || completed}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
