'use client'

import { ThemeSettings } from '@/lib/types'

interface ChatOverlaysProps {
  // Scene
  showSceneOverlay: boolean
  showSceneBar: boolean
  sceneBarText: string
  // Event
  activeEvent: string | null
  onDismissEvent: () => void
  // Milestone
  showMilestone: string | null
  // Recap
  showRecap: boolean
  bondStart: number
  bondLevel: number
  bondTier: 'stranger' | 'familiar' | 'intimate'
  bondTierNames?: string[]
  milestonesAchieved: string[]
  choiceHistory: { text: string; hint: string }[]
  messageCount: number
  submitting: boolean
  theme: ThemeSettings
}

export function ChatOverlays({
  showSceneOverlay,
  showSceneBar,
  sceneBarText,
  activeEvent,
  onDismissEvent,
  showMilestone,
  showRecap,
  bondStart,
  bondLevel,
  bondTier,
  bondTierNames,
  milestonesAchieved,
  choiceHistory,
  messageCount,
  submitting,
  theme,
}: ChatOverlaysProps) {
  const tierName = bondTier === 'intimate'
    ? (bondTierNames?.[2] || '知己')
    : bondTier === 'familiar'
      ? (bondTierNames?.[1] || '渐熟')
      : (bondTierNames?.[0] || '初识')

  return (
    <>
      {/* Scene blur overlay */}
      {showSceneOverlay && (
        <div className="absolute inset-0 z-40 bg-white/30 animate-sceneBlur pointer-events-none" />
      )}

      {/* Scene description bar */}
      {showSceneBar && (
        <div className="absolute bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="animate-sceneBar bg-black/40 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full">
            📍 {sceneBarText}
          </div>
        </div>
      )}

      {/* Event card overlay */}
      {activeEvent && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onDismissEvent}>
          <div className="animate-eventCardIn max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">📖</div>
            <p className="text-gray-800 text-sm leading-relaxed mb-4">{activeEvent}</p>
            <button
              onClick={onDismissEvent}
              className="px-6 py-2 rounded-full text-sm text-white transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: theme.primaryColor }}
            >
              继续
            </button>
          </div>
        </div>
      )}

      {/* Milestone popup */}
      {showMilestone && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="animate-milestoneIn bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-xs text-yellow-600 font-medium">成就解锁</p>
              <p className="text-sm text-gray-800 font-semibold">{showMilestone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recap overlay */}
      {showRecap && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fadeIn">
          <div className="max-w-sm w-full bg-white rounded-2xl p-6 shadow-2xl animate-bounceIn">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="text-lg font-bold text-gray-800">对话回顾</h3>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
              <span className="text-sm text-gray-500">亲密度变化</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{bondStart}</span>
                <span className="text-gray-300">→</span>
                <span className="text-sm font-bold" style={{ color: bondTier === 'intimate' ? '#f472b6' : bondTier === 'familiar' ? '#60a5fa' : '#9ca3af' }}>{bondLevel}</span>
                <span className="text-xs text-green-500 font-medium">+{bondLevel - bondStart}</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
              <span className="text-sm text-gray-500">关系阶段</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                bondTier === 'intimate' ? 'bg-pink-50 text-pink-600' :
                bondTier === 'familiar' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {tierName}
              </span>
            </div>
            {milestonesAchieved.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-yellow-600 font-medium mb-2">解锁的里程碑</p>
                <div className="flex flex-wrap gap-1.5">
                  {milestonesAchieved.map((m, i) => (
                    <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ {m}</span>
                  ))}
                </div>
              </div>
            )}
            {choiceHistory.length > 0 && (
              <div className="bg-indigo-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-indigo-600 font-medium mb-2">你的选择</p>
                <div className="space-y-1">
                  {choiceHistory.map((c, i) => (
                    <p key={i} className="text-xs text-indigo-700">⚡ {c.text}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <span className="text-sm text-gray-500">对话轮数</span>
              <span className="text-sm font-bold text-gray-700">{messageCount} 轮</span>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">{submitting ? '提交中...' : '正在提交...'}</p>
          </div>
        </div>
      )}
    </>
  )
}
