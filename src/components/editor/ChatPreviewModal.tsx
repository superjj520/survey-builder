'use client'

import { useState, useEffect, useRef } from 'react'
import { ThemeSettings } from '@/lib/types'
import { X, BookOpen, Volume2, RefreshCw, MessageSquare, Target } from 'lucide-react'

interface ChatPreviewModalProps {
  open: boolean
  onClose: () => void
  config: {
    roleName: string
    scene: string
    personality: string
    avatarStyle: string
    tone: string
    habit: string
    bondTierNames: string[]
    bondStart: number
    theme: ThemeSettings
    features?: {
      mood?: boolean
      scene?: boolean
      suggest?: boolean
      game?: boolean
      event?: boolean
      choice?: boolean
      bond?: boolean
      milestone?: boolean
    }
    stickers?: { name: string; url: string }[]
    retractEnabled?: boolean
    ttsEnabled?: boolean
  }
}

interface MockMessage {
  role: 'user' | 'assistant'
  content: string
  mood?: string
  moodIntensity?: number
  scene?: string
  suggests?: string[]
  game?: { type: string; data: string[] }
  event?: string
  choice?: { text: string; hint: string }[]
  bond?: number
  milestone?: string
  isSplit?: boolean
  sticker?: string
  isRetracted?: boolean
}

const MOOD_MAP: Record<string, { emoji: string; color: string; animation: string }> = {
  happy: { emoji: '😊', color: '#fbbf24', animation: 'mood-glow-breath' },
  thinking: { emoji: '🤔', color: '#60a5fa', animation: 'mood-glow-pulse' },
  excited: { emoji: '😆', color: '#f472b6', animation: 'mood-glow-bounce' },
  shy: { emoji: '😳', color: '#fda4af', animation: 'mood-glow-flicker' },
  sad: { emoji: '😢', color: '#9ca3af', animation: '' },
  angry: { emoji: '😤', color: '#ef4444', animation: '' },
  neutral: { emoji: '', color: '', animation: '' },
}

const SCENE_THEMES: { keywords: string[]; gradient: string; isDark?: boolean }[] = [
  { keywords: ['咖啡', '茶', '餐厅', '厨房'], gradient: 'linear-gradient(135deg, #f5e6d3, #e8d5c4)' },
  { keywords: ['夜', '深夜', '晚', '月光', '星空'], gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)', isDark: true },
  { keywords: ['阳台', '户外', '公园', '花园', '森林'], gradient: 'linear-gradient(135deg, #e0f7fa, #b2dfdb)' },
  { keywords: ['办公', '教室', '书房', '图书馆'], gradient: 'linear-gradient(135deg, #f5f5f5, #eeeeee)' },
  { keywords: ['开心', '兴奋', '庆祝', '派对'], gradient: 'linear-gradient(135deg, #fff9e6, #ffe4e6)' },
  { keywords: ['伤心', '告别', '安静', '雨'], gradient: 'linear-gradient(135deg, #e3e8ef, #dfe3e8)' },
]

function getSceneGradient(scene: string): { gradient: string; isDark: boolean } | null {
  for (const t of SCENE_THEMES) {
    if (t.keywords.some(k => scene.includes(k))) {
      return { gradient: t.gradient, isDark: !!t.isDark }
    }
  }
  return null
}

function generateMockMessages(config: ChatPreviewModalProps['config']): MockMessage[] {
  const { roleName, scene, features = {} } = config
  const ft = {
    mood: features.mood !== false,
    scene: features.scene !== false,
    suggest: features.suggest !== false,
    game: features.game !== false,
    event: features.event !== false,
    choice: features.choice !== false,
    bond: features.bond !== false,
    milestone: features.milestone !== false,
  }

  const msgs: MockMessage[] = []

  // ════════════════════════════════════════════════════════════
  // Phase 1: 陌生阶段 (bond 20→30) — 约15条
  // ════════════════════════════════════════════════════════════

  msgs.push({
    role: 'assistant',
    content: `*${roleName}微微一笑*\n你好呀~ 欢迎来到这里。`,
    mood: ft.mood ? 'happy' : undefined,
    moodIntensity: ft.mood ? 3 : undefined,
    scene: ft.scene ? (scene || '温馨的小房间，柔和的灯光') : undefined,
    bond: ft.bond ? 2 : undefined,
    suggests: ft.suggest ? ['你好！', '这里是哪里？', '你是谁呀'] : undefined,
  })

  msgs.push({ role: 'user', content: '你好！这里是什么地方？' })

  msgs.push({
    role: 'assistant',
    content: `*眼睛一亮*\n哇，你也对这里感到好奇！`,
    mood: ft.mood ? 'excited' : undefined,
    moodIntensity: ft.mood ? 4 : undefined,
    bond: ft.bond ? 2 : undefined,
  })

  // SPLIT demo
  msgs.push({
    role: 'assistant',
    content: '让我跟你慢慢说~',
    isSplit: true,
    bond: ft.bond ? 1 : undefined,
  })

  msgs.push({ role: 'user', content: '好啊，你慢慢说' })

  msgs.push({
    role: 'assistant',
    content: `*${roleName}神秘一笑*\n嘿嘿~ 其实这是一个可以畅所欲言的地方。`,
    mood: ft.mood ? 'shy' : undefined,
    moodIntensity: ft.mood ? 2 : undefined,
    bond: ft.bond ? 2 : undefined,
    suggests: ft.suggest ? ['听起来有趣', '还有呢？', '给我多讲讲'] : undefined,
  })

  msgs.push({ role: 'user', content: '听起来有趣！你平时都在这里做什么？' })

  msgs.push({
    role: 'assistant',
    content: `*歪着头想了想*\n唔...我喜欢听大家讲故事，每个人都有特别的经历嘛~`,
    mood: ft.mood ? 'thinking' : undefined,
    moodIntensity: ft.mood ? 3 : undefined,
    bond: ft.bond ? 2 : undefined,
  })

  msgs.push({ role: 'user', content: '哈哈，我也很喜欢听故事' })

  msgs.push({
    role: 'assistant',
    content: `真的吗！太好了！`,
    mood: ft.mood ? 'excited' : undefined,
    moodIntensity: ft.mood ? 4 : undefined,
    bond: ft.bond ? 3 : undefined,
  })

  msgs.push({
    role: 'assistant',
    content: `那你有什么故事想分享的吗？不用太正式，随便聊聊就好~`,
    isSplit: true,
    suggests: ft.suggest ? ['最近发生了件事', '我想想...', '你先讲一个'] : undefined,
  })

  msgs.push({ role: 'user', content: '最近发生了一些有意思的事情' })

  msgs.push({
    role: 'assistant',
    content: `*身子前倾，认真听的样子*\n哦？快跟我说说！我超好奇的~`,
    mood: ft.mood ? 'excited' : undefined,
    moodIntensity: ft.mood ? 3 : undefined,
    bond: ft.bond ? 2 : undefined,
  })

  msgs.push({ role: 'user', content: '我参加了一个很有趣的活动，认识了很多新朋友' })

  msgs.push({
    role: 'assistant',
    content: `*开心地拍了拍手*\n哇哇哇！听起来超棒的！是什么活动呀？`,
    mood: ft.mood ? 'happy' : undefined,
    moodIntensity: ft.mood ? 5 : undefined,
    bond: ft.bond ? 3 : undefined,
  })

  msgs.push({ role: 'user', content: '一个户外露营活动' })

  // ════════════════════════════════════════════════════════════
  // Phase 2: 渐熟阶段 (bond 30→60) — 约20条
  // ════════════════════════════════════════════════════════════

  if (ft.milestone) {
    msgs.push({
      role: 'assistant',
      content: `*眼里闪着光*\n露营！我也好想去！以后如果有机会...我们也可以一起去吧？`,
      mood: ft.mood ? 'excited' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 4 : undefined,
      milestone: '第一次深入交流',
    })
  } else {
    msgs.push({
      role: 'assistant',
      content: `*眼里闪着光*\n露营！我也好想去！跟我说说细节嘛~`,
      mood: ft.mood ? 'excited' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 4 : undefined,
    })
  }

  // Scene change
  if (ft.scene) {
    msgs.push({ role: 'user', content: '好呀！我给你形容一下那天的场景' })

    msgs.push({
      role: 'assistant',
      content: `*站起来走到窗边*\n走，我们去阳台上聊吧，这样更有意境~`,
      scene: '阳台上，微风轻拂，远处是城市天际线，天边泛着暖橙色的晚霞',
      mood: ft.mood ? 'happy' : undefined,
      moodIntensity: ft.mood ? 3 : undefined,
      bond: ft.bond ? 3 : undefined,
    })
  }

  msgs.push({ role: 'user', content: '那天晚上星空超美的，我们围着篝火聊到很晚' })

  msgs.push({
    role: 'assistant',
    content: `*闭上眼睛想象*\n天啊... 篝火和星空，这画面也太美了吧...`,
    mood: ft.mood ? 'thinking' : undefined,
    moodIntensity: ft.mood ? 4 : undefined,
    bond: ft.bond ? 3 : undefined,
  })

  msgs.push({
    role: 'assistant',
    content: `我有点羡慕呢`,
    isSplit: true,
    mood: ft.mood ? 'shy' : undefined,
    moodIntensity: ft.mood ? 2 : undefined,
  })

  // Game demo
  if (ft.game) {
    msgs.push({ role: 'user', content: '哈哈，说着说着有点无聊了，我们玩点什么吧？' })

    msgs.push({
      role: 'assistant',
      content: `*蹦起来*\n好呀好呀！来玩真心话大冒险——你选哪个？`,
      mood: ft.mood ? 'excited' : undefined,
      moodIntensity: ft.mood ? 5 : undefined,
      game: { type: 'truth_or_dare', data: ['真心话', '大冒险'] },
      bond: ft.bond ? 2 : undefined,
    })

    msgs.push({ role: 'user', content: '真心话！' })

    msgs.push({
      role: 'assistant',
      content: `*坏笑*\n嘿嘿~ 那我问你哦...\n\n你觉得我是一个什么样的人？`,
      mood: ft.mood ? 'excited' : undefined,
      moodIntensity: ft.mood ? 3 : undefined,
      bond: ft.bond ? 3 : undefined,
      suggests: ft.suggest ? ['很有趣！', '善良又温暖', '有点傲娇哈哈'] : undefined,
    })

    msgs.push({ role: 'user', content: '你很有趣，跟你聊天很开心！' })

    msgs.push({
      role: 'assistant',
      content: `*脸微微红了*\n哎呀... 突然被夸好不习惯...`,
      mood: ft.mood ? 'shy' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 5 : undefined,
    })
  }

  // Choice demo
  if (ft.choice) {
    msgs.push({
      role: 'assistant',
      content: `*深吸一口气*\n那我问你一个认真的问题好吗？这对我来说...挺重要的。`,
      mood: ft.mood ? 'thinking' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      choice: [
        { text: '好啊，问吧', hint: '坦然面对' },
        { text: '有点紧张...', hint: '表达真实感受' },
        { text: '你先说你的事', hint: '转移话题' },
      ],
      bond: ft.bond ? 4 : undefined,
    })

    msgs.push({ role: 'user', content: '好啊，问吧！' })
  }

  // Event demo
  if (ft.event) {
    msgs.push({
      role: 'assistant',
      content: '',
      event: `${roleName}的表情突然变得认真起来，空气中安静了几秒，窗外的风也似乎停了...`,
    })

    msgs.push({
      role: 'assistant',
      content: `*看着你的眼睛*\n其实...我一直想说，能认识你真的很高兴。`,
      mood: ft.mood ? 'shy' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 5 : undefined,
    })
  }

  msgs.push({ role: 'user', content: '我也是，跟你聊天总是很放松' })

  msgs.push({
    role: 'assistant',
    content: `*开心地笑了*\n嘿嘿~ 那以后要经常来找我聊天哦！不许消失！`,
    mood: ft.mood ? 'happy' : undefined,
    moodIntensity: ft.mood ? 5 : undefined,
    bond: ft.bond ? 4 : undefined,
  })

  // ════════════════════════════════════════════════════════════
  // Phase 3: 亲密阶段 (bond 60+) — 约15条
  // ════════════════════════════════════════════════════════════

  if (ft.scene) {
    msgs.push({
      role: 'assistant',
      content: `*拉着你的手*\n走，我带你去一个特别的地方~`,
      scene: '深夜的阳台，城市灯火阑珊，星星点点',
      mood: ft.mood ? 'excited' : undefined,
      moodIntensity: ft.mood ? 3 : undefined,
      bond: ft.bond ? 3 : undefined,
    })
  }

  if (ft.bond && ft.milestone) {
    msgs.push({ role: 'user', content: '我们现在算是很好的朋友了吧？' })

    msgs.push({
      role: 'assistant',
      content: `*用力点头*\n当然！你是我最好的朋友！不对...比朋友更重要的那种！`,
      mood: ft.mood ? 'happy' : undefined,
      moodIntensity: ft.mood ? 5 : undefined,
      bond: ft.bond ? 6 : undefined,
      milestone: '成为好朋友',
    })
  }

  // Retract demo
  if (config.retractEnabled) {
    msgs.push({
      role: 'assistant',
      content: '其实我一直想跟你说——',
      isRetracted: true,
    })
    msgs.push({
      role: 'assistant',
      content: `*不好意思地摸摸头*\n啊抱歉发错了！我想说的是，今天聊得真开心~`,
      mood: ft.mood ? 'shy' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 2 : undefined,
    })
  }

  // Sticker demo
  if (config.stickers && config.stickers.length > 0) {
    msgs.push({ role: 'user', content: '哈哈你好可爱' })

    msgs.push({
      role: 'assistant',
      content: `嘿嘿~`,
      sticker: config.stickers[0].name,
      mood: ft.mood ? 'happy' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 2 : undefined,
    })
  }

  msgs.push({ role: 'user', content: '对了，你有什么烦恼吗？也可以跟我说说' })

  msgs.push({
    role: 'assistant',
    content: `*愣了一下，然后笑了*\n你是第一个问我这个的人呢...`,
    mood: ft.mood ? 'thinking' : undefined,
    moodIntensity: ft.mood ? 3 : undefined,
    bond: ft.bond ? 5 : undefined,
  })

  msgs.push({
    role: 'assistant',
    content: `谢谢你关心我`,
    isSplit: true,
    mood: ft.mood ? 'shy' : undefined,
    moodIntensity: ft.mood ? 3 : undefined,
  })

  msgs.push({ role: 'user', content: '当然啦，朋友之间就是互相关心的' })

  if (ft.mood) {
    msgs.push({
      role: 'assistant',
      content: `*突然有点想哭*\n...你真的好温柔。有时候我会觉得，遇到你真的太幸运了。`,
      mood: 'sad',
      moodIntensity: 2,
      bond: ft.bond ? 4 : undefined,
    })

    msgs.push({
      role: 'assistant',
      content: `*赶紧擦了擦眼角*\n啊不是不是！我没事！就是太感动了嘛~`,
      mood: 'shy',
      moodIntensity: 3,
      isSplit: true,
      bond: ft.bond ? 2 : undefined,
    })
  }

  // TTS indicator
  if (config.ttsEnabled) {
    msgs.push({
      role: 'assistant',
      content: `*清了清嗓子*\n这句话我要用声音说给你听——谢谢你一直陪着我。`,
      mood: ft.mood ? 'happy' : undefined,
      moodIntensity: ft.mood ? 4 : undefined,
      bond: ft.bond ? 3 : undefined,
    })
  }

  msgs.push({ role: 'user', content: '时间过得好快呀' })

  msgs.push({
    role: 'assistant',
    content: `*看了看窗外*\n是呀...不知不觉已经聊了这么久了~`,
    mood: ft.mood ? 'thinking' : undefined,
    moodIntensity: ft.mood ? 2 : undefined,
    bond: ft.bond ? 2 : undefined,
  })

  msgs.push({
    role: 'assistant',
    content: `但是跟你在一起的时间总是过得特别快！`,
    isSplit: true,
    mood: ft.mood ? 'happy' : undefined,
    moodIntensity: ft.mood ? 4 : undefined,
  })

  // Final messages
  msgs.push({ role: 'user', content: '下次再聊！' })

  msgs.push({
    role: 'assistant',
    content: `*恋恋不舍地挥手*\n好~ 下次见！记得想我哦！`,
    mood: ft.mood ? 'happy' : undefined,
    moodIntensity: ft.mood ? 5 : undefined,
    bond: ft.bond ? 3 : undefined,
    suggests: ft.suggest ? ['一定会的！', '你也要好好的', '明天见~'] : undefined,
  })

  if (config.stickers && config.stickers.length > 1) {
    msgs.push({
      role: 'assistant',
      content: '',
      sticker: config.stickers[Math.min(1, config.stickers.length - 1)].name,
      bond: ft.bond ? 1 : undefined,
    })
  }

  return msgs
}

export function ChatPreviewModal({ open, onClose, config }: ChatPreviewModalProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentBond, setCurrentBond] = useState(config.bondStart)
  const [showEvent, setShowEvent] = useState<string | null>(null)
  const [showMilestone, setShowMilestone] = useState<string | null>(null)
  const [bondDelta, setBondDelta] = useState<number | null>(null)
  const [currentScene, setCurrentScene] = useState(config.scene || '')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const messages = generateMockMessages(config)
  const avatarUrl = `https://api.dicebear.com/9.x/${config.avatarStyle || 'avataaars'}/svg?seed=${encodeURIComponent(config.roleName)}&size=80`

  const sceneData = getSceneGradient(currentScene || config.scene || '温馨')
  const bgGradient = sceneData?.gradient || config.theme.backgroundGradient || '#f0ebf8'
  const isDark = sceneData?.isDark || false

  useEffect(() => {
    if (open) {
      setVisibleCount(0)
      setCurrentBond(config.bondStart)
      setCurrentScene(config.scene || '')
      setPlaying(true)
    } else {
      setPlaying(false)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, config.bondStart, config.scene])

  useEffect(() => {
    if (!playing || visibleCount >= messages.length) {
      setPlaying(false)
      return
    }
    timerRef.current = setTimeout(() => {
      setVisibleCount(v => {
        const next = v + 1
        const msg = messages[next - 1]
        if (msg?.bond) {
          setCurrentBond(b => Math.min(100, b + msg.bond!))
          setBondDelta(msg.bond)
          setTimeout(() => setBondDelta(null), 1200)
        }
        if (msg?.event) {
          setShowEvent(msg.event)
          setTimeout(() => setShowEvent(null), 2500)
        }
        if (msg?.milestone) {
          setShowMilestone(msg.milestone)
          setTimeout(() => setShowMilestone(null), 2000)
        }
        if (msg?.scene) {
          setCurrentScene(msg.scene)
        }
        return next
      })
    }, visibleCount === 0 ? 500 : 1200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, visibleCount, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleCount])

  const handleNext = () => {
    if (visibleCount < messages.length) {
      const msg = messages[visibleCount]
      if (msg?.bond) {
        setCurrentBond(b => Math.min(100, b + msg.bond!))
        setBondDelta(msg.bond)
        setTimeout(() => setBondDelta(null), 1200)
      }
      if (msg?.event) {
        setShowEvent(msg.event)
        setTimeout(() => setShowEvent(null), 2500)
      }
      if (msg?.milestone) {
        setShowMilestone(msg.milestone)
        setTimeout(() => setShowMilestone(null), 2000)
      }
      if (msg?.scene) {
        setCurrentScene(msg.scene)
      }
      setVisibleCount(v => v + 1)
    }
  }

  const handleReplay = () => {
    setVisibleCount(0)
    setCurrentBond(config.bondStart)
    setCurrentScene(config.scene || '')
    setPlaying(true)
  }

  if (!open) return null

  const bondTier = currentBond < 30 ? 0 : currentBond < 60 ? 1 : 2
  const tierName = config.bondTierNames[bondTier] || ['初识', '渐熟', '知己'][bondTier]
  const tierColor = bondTier === 2 ? '#f472b6' : bondTier === 1 ? '#60a5fa' : '#9ca3af'

  const visibleMessages = messages.slice(0, visibleCount)
  const lastMood = [...visibleMessages].reverse().find(m => m.mood)?.mood || 'neutral'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bgGradient }}>
      {/* Event overlay */}
      {showEvent && (
        <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="animate-eventCardIn max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 text-center shadow-2xl">
            <div className="mb-3 flex justify-center"><BookOpen className="w-6 h-6 text-indigo-500" /></div>
            <p className="text-gray-800 text-sm leading-relaxed">{showEvent}</p>
          </div>
        </div>
      )}

      {/* Milestone popup */}
      {showMilestone && (
        <div className="absolute top-20 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="animate-milestoneIn bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-xs text-yellow-600 font-medium">成就解锁</p>
              <p className="text-sm text-gray-800 font-semibold">{showMilestone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex-shrink-0 backdrop-blur-sm border-b px-4 py-3 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white/90 border-gray-100'}`}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={config.roleName}
              className={`w-10 h-10 rounded-full shadow-sm bg-gray-100 ${MOOD_MAP[lastMood]?.animation || ''}`}
              style={{ '--mood-color': MOOD_MAP[lastMood]?.color || '' } as React.CSSProperties}
            />
            {lastMood !== 'neutral' && MOOD_MAP[lastMood]?.emoji && (
              <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {MOOD_MAP[lastMood]?.emoji}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{config.roleName}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tierColor + '20', color: tierColor }}>
                {tierName}
              </span>
            </div>
            <div className="relative mt-1">
              <div className={`h-1 rounded-full w-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${currentBond}%`, backgroundColor: tierColor }} />
              </div>
              {bondDelta !== null && (
                <span className="absolute -top-3 right-0 text-xs font-bold animate-bondFloat text-pink-500">+{bondDelta}</span>
              )}
            </div>
          </div>
          {/* Preview badge */}
          <span className="text-[10px] px-2 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">预览</span>
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-3">
          {visibleMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end animate-chatSlideRight' : 'justify-start animate-chatSlideLeft'}`}>
              {msg.role === 'assistant' && (
                <div className="relative flex-shrink-0 mr-2 mt-1">
                  <img src={avatarUrl} alt={config.roleName} className="w-8 h-8 rounded-full bg-gray-100 shadow-sm" />
                  {msg.mood && msg.mood !== 'neutral' && MOOD_MAP[msg.mood]?.emoji && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">{MOOD_MAP[msg.mood].emoji}</span>
                  )}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : msg.isRetracted
                    ? 'bg-gray-100 text-gray-400 rounded-bl-md'
                    : isDark
                      ? 'bg-white/10 text-white shadow-sm border border-white/10 rounded-bl-md'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
              }`}>
                {msg.isRetracted ? (
                  <span className="text-xs text-gray-400 line-through">此消息已撤回</span>
                ) : msg.sticker && config.stickers ? (
                  <div className="py-1">
                    {(() => {
                      const s = config.stickers?.find(st => st.name === msg.sticker)
                      return s ? <img src={s.url} alt={msg.sticker} className="w-20 h-20 object-contain" /> : <span className="text-2xl">{msg.sticker}</span>
                    })()}
                    {msg.content && renderContent(msg.content, isDark)}
                  </div>
                ) : msg.content ? (
                  renderContent(msg.content, isDark)
                ) : null}
                {config.ttsEnabled && msg.role === 'assistant' && msg.content && !msg.isRetracted && (
                  <span className="inline-flex items-center mt-1 text-[10px] opacity-50 text-gray-400"><Volume2 className="w-2.5 h-2.5" /></span>
                )}
              </div>
            </div>
          ))}

          {/* Interactive elements of last visible message */}
          {visibleMessages.length > 0 && (() => {
            const last = visibleMessages[visibleMessages.length - 1]
            if (last.role !== 'assistant') return null
            return (
              <>
                {last.suggests && (
                  <div className="flex flex-wrap gap-2 ml-10">
                    {last.suggests.map((s, i) => (
                      <span key={i} className="animate-suggestSlideUp text-sm px-4 py-1.5 rounded-full border pointer-events-none opacity-70"
                        style={{ animationDelay: `${i * 50}ms`, borderColor: config.theme.primaryColor, color: isDark ? '#fff' : config.theme.primaryColor }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {last.game && (
                  <div className="ml-10 animate-gameCardIn">
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-white/10' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
                      <div className="flex gap-3">
                        {last.game.data.map((opt, i) => (
                          <div key={i} className="flex-1 py-4 rounded-xl text-center pointer-events-none opacity-80"
                            style={{ backgroundColor: i === 0 ? '#ede9fe' : '#fce7f3', color: i === 0 ? '#7c3aed' : '#db2777' }}>
                            <div className="flex justify-center mb-1">{i === 0 ? <MessageSquare className="w-6 h-6" /> : <Target className="w-6 h-6" />}</div>
                            <div className="text-sm font-medium">{opt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {last.choice && (
                  <div className="ml-10 space-y-2">
                    {last.choice.map((opt, i) => (
                      <div key={i} className="animate-choiceCardIn rounded-xl p-4 pointer-events-none opacity-80"
                        style={{ animationDelay: `${i * 100}ms`, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}` }}>
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: config.theme.primaryColor + '20', color: config.theme.primaryColor }}>
                            {i + 1}
                          </span>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{opt.text}</p>
                            <p className="text-xs mt-0.5 text-gray-400">{opt.hint}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`flex-shrink-0 backdrop-blur-sm border-t px-4 py-3 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white/90 border-gray-100'}`}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Progress */}
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(visibleCount / messages.length) * 100}%`, backgroundColor: config.theme.primaryColor }} />
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{visibleCount} / {messages.length} 条消息</p>
          </div>
          {/* Controls */}
          <div className="flex gap-2">
            {playing ? (
              <button onClick={() => setPlaying(false)} className="px-3 py-2 rounded-full text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
                ⏸ 暂停
              </button>
            ) : visibleCount < messages.length ? (
              <button onClick={() => setPlaying(true)} className="px-3 py-2 rounded-full text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
                ▶ 播放
              </button>
            ) : null}
            {visibleCount >= messages.length ? (
              <button onClick={handleReplay} className="px-4 py-2 rounded-full text-sm text-white transition-all hover:scale-105"
                style={{ backgroundColor: config.theme.primaryColor }}>
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> 重播</span>
              </button>
            ) : (
              <button onClick={() => { setPlaying(false); handleNext() }} className="px-4 py-2 rounded-full text-sm text-white transition-all hover:scale-105"
                style={{ backgroundColor: config.theme.primaryColor }}>
                下一条 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderContent(content: string, isDark: boolean) {
  const parts = content.split(/(\*[^*]+\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="not-italic text-xs block my-1 text-gray-400">{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}
