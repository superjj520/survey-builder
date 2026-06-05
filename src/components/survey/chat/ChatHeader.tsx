'use client'

import { useState } from 'react'
import { MoodType, MOOD_MAP } from '@/lib/marker-parser'
import { ThemeSettings } from '@/lib/types'

interface ChatHeaderProps {
  avatarUrl: string
  roleName: string
  currentMood: MoodType
  currentMoodIntensity: number
  bondLevel: number
  bondTier: 'stranger' | 'familiar' | 'intimate'
  bondDelta: number | null
  bondTierNames?: string[]
  chatPersonality?: string
  isDarkScene: boolean
  theme: ThemeSettings
}

export function ChatHeader({
  avatarUrl,
  roleName,
  currentMood,
  currentMoodIntensity,
  bondLevel,
  bondTier,
  bondDelta,
  bondTierNames,
  chatPersonality,
  isDarkScene,
  theme,
}: ChatHeaderProps) {
  const [avatarError, setAvatarError] = useState(false)
  const moodData = MOOD_MAP[currentMood]
  const tierName = bondTier === 'intimate'
    ? (bondTierNames?.[2] || '知己')
    : bondTier === 'familiar'
      ? (bondTierNames?.[1] || '渐熟')
      : (bondTierNames?.[0] || '初识')
  const tierColor = bondTier === 'intimate' ? '#f472b6' : bondTier === 'familiar' ? '#60a5fa' : '#9ca3af'

  return (
    <div className={`flex-shrink-0 backdrop-blur-sm border-b px-4 py-3 safe-area-top ${isDarkScene ? 'bg-black/30 border-white/10' : 'bg-white/90 border-gray-100'}`}>
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="relative">
          {avatarError ? (
            <div
              className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center text-white font-medium text-lg ${moodData.animation}`}
              style={{
                '--mood-color': moodData.color,
                background: `linear-gradient(135deg, ${theme.primaryColor}, #8b5cf6)`,
                border: currentMood !== 'neutral' ? `2.5px solid ${moodData.color}` : '2px solid transparent',
              } as React.CSSProperties}
            >
              {roleName.charAt(0)}
            </div>
          ) : (
            <img
              src={avatarUrl}
              alt={roleName}
              className={`w-11 h-11 rounded-full shadow-md bg-gray-100 transition-all duration-300 ${moodData.animation}`}
              style={{
                '--mood-color': moodData.color,
                animationDuration: `${1.8 - currentMoodIntensity * 0.2}s`,
                filter: currentMoodIntensity >= 3 ? `drop-shadow(0 0 ${currentMoodIntensity * 3}px ${moodData.color || theme.primaryColor})` : undefined,
                border: currentMood !== 'neutral' ? `2.5px solid ${moodData.color}` : '2px solid transparent',
              } as React.CSSProperties}
              onError={() => setAvatarError(true)}
            />
          )}
          {currentMood !== 'neutral' && moodData.emoji && (
            <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-bounceIn" style={{ border: `1.5px solid ${moodData.color}` }}>
              {moodData.emoji}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${isDarkScene ? 'text-white' : 'text-gray-800'}`}>{roleName}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              bondTier === 'intimate' ? 'bg-pink-50 text-pink-500' :
              bondTier === 'familiar' ? 'bg-blue-50 text-blue-500' :
              'bg-gray-50 text-gray-400'
            }`}>
              {tierName}
            </span>
          </div>
          <div className="relative mt-1">
            <div className={`h-1 rounded-full w-full ${isDarkScene ? 'bg-white/10' : 'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${bondLevel}%`, backgroundColor: tierColor }}
              />
            </div>
            {bondDelta !== null && (
              <span className={`absolute -top-3 right-0 text-xs font-bold animate-bondFloat ${bondDelta > 0 ? 'text-pink-500' : 'text-gray-400'}`}>
                {bondDelta > 0 ? `+${bondDelta}` : bondDelta}
              </span>
            )}
          </div>
        </div>
        {chatPersonality && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${isDarkScene ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
            {chatPersonality.split('、')[0]}
          </span>
        )}
      </div>
    </div>
  )
}
