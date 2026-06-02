// ─── Marker Parser ───────────────────────────────────────────────────────────
// Parses AI response markers like [MOOD:happy:3], [SCENE:...], [SPLIT], etc.
// Shared between ChatView, ChatPreviewModal, and future mini-program.

export type MoodType = 'happy' | 'thinking' | 'sad' | 'excited' | 'shy' | 'angry' | 'neutral'

export interface GameData {
  type: 'truth_or_dare' | 'guess' | 'vote' | 'word_chain' | 'quiz' | 'fortune' | 'roleplay' | 'confession'
  data: string[]
}

export interface ChoiceOption {
  text: string
  hint: string
}

export interface ParsedMarkers {
  segments: string[]
  mood?: MoodType
  moodIntensity?: number
  scene?: string
  suggests?: string[]
  game?: GameData
  event?: string
  choice?: ChoiceOption[]
  bond?: number
  milestone?: string
  sticker?: string
  retract?: boolean
  voice?: string
}

export function parseMarkers(raw: string): ParsedMarkers {
  let content = raw
  let mood: MoodType | undefined
  let scene: string | undefined
  let suggests: string[] | undefined
  let game: GameData | undefined
  let event: string | undefined
  let choice: ChoiceOption[] | undefined
  let bond: number | undefined
  let milestone: string | undefined
  let moodIntensity: number | undefined
  let sticker: string | undefined
  let retract = false

  // Extract MOOD (supports [MOOD:happy] or [MOOD:happy:3])
  const moodMatch = content.match(/\[MOOD:(\w+?)(?::(\d))?\]/)
  if (moodMatch) {
    mood = moodMatch[1] as MoodType
    moodIntensity = moodMatch[2] ? parseInt(moodMatch[2]) : 3
    content = content.replace(moodMatch[0], '')
  }

  // Extract SCENE
  const sceneMatch = content.match(/\[SCENE:([^\]]+)\]/)
  if (sceneMatch) {
    scene = sceneMatch[1]
    content = content.replace(sceneMatch[0], '')
  }

  // Extract SUGGEST
  const suggestMatch = content.match(/\[SUGGEST:([^\]]+)\]/)
  if (suggestMatch) {
    suggests = suggestMatch[1].split('|').map(s => s.trim()).filter(Boolean)
    content = content.replace(suggestMatch[0], '')
  }

  // Extract GAME (all 8 types)
  const gameMatch = content.match(/\[GAME:(truth_or_dare|guess|vote|word_chain|quiz|fortune|roleplay|confession)\|([^\]]+)\]/)
  if (gameMatch) {
    game = { type: gameMatch[1] as GameData['type'], data: gameMatch[2].split('|').map(s => s.trim()) }
    content = content.replace(gameMatch[0], '')
  }

  // Extract EVENT
  const eventMatch = content.match(/\[EVENT:([^\]]+)\]/)
  if (eventMatch) {
    event = eventMatch[1]
    content = content.replace(eventMatch[0], '')
  }

  // Extract CHOICE
  const choiceMatch = content.match(/\[CHOICE:([^\]]+)\]/)
  if (choiceMatch) {
    choice = choiceMatch[1].split('|').map(c => {
      const [text, hint] = c.split('→').map(s => s.trim())
      return { text, hint: hint || '' }
    })
    content = content.replace(choiceMatch[0], '')
  }

  // Extract BOND
  const bondMatch = content.match(/\[BOND:([+-]?\d+)\]/)
  if (bondMatch) {
    bond = parseInt(bondMatch[1])
    content = content.replace(bondMatch[0], '')
  }

  // Extract MILESTONE
  const milestoneMatch = content.match(/\[MILESTONE:([^\]]+)\]/)
  if (milestoneMatch) {
    milestone = milestoneMatch[1]
    content = content.replace(milestoneMatch[0], '')
  }

  // Extract STICKER
  const stickerMatch = content.match(/\[STICKER:([^\]]+)\]/)
  if (stickerMatch) {
    sticker = stickerMatch[1]
    content = content.replace(stickerMatch[0], '')
  }

  // Extract RETRACT
  if (content.includes('[RETRACT]')) {
    retract = true
    content = content.replace('[RETRACT]', '')
  }

  // Extract VOICE (custom TTS content)
  let voice: string | undefined
  const voiceMatch = content.match(/\[VOICE:([^\]]+)\]/)
  if (voiceMatch) {
    voice = voiceMatch[1]
    content = content.replace(voiceMatch[0], '')
  }

  // Split by [SPLIT] marker
  const segments = content.split('[SPLIT]').map(s => s.trim()).filter(Boolean)

  return { segments, mood, moodIntensity, scene, suggests, game, event, choice, bond, milestone, sticker, retract, voice }
}

// ─── Scene helpers ───────────────────────────────────────────────────────────

export const SCENE_THEMES: { keywords: string[]; gradient: string; isDark?: boolean }[] = [
  { keywords: ['咖啡', '茶', '餐厅', '厨房', '烘焙'], gradient: 'linear-gradient(135deg, #f5e6d3, #e8d5c4)' },
  { keywords: ['夜', '深夜', '晚', '月光', '星空'], gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)', isDark: true },
  { keywords: ['阳台', '户外', '公园', '花园', '草地', '森林'], gradient: 'linear-gradient(135deg, #e0f7fa, #b2dfdb)' },
  { keywords: ['办公', '教室', '书房', '图书馆', '会议'], gradient: 'linear-gradient(135deg, #f5f5f5, #eeeeee)' },
  { keywords: ['开心', '兴奋', '庆祝', '派对', '节日'], gradient: 'linear-gradient(135deg, #fff9e6, #ffe4e6)' },
  { keywords: ['伤心', '告别', '安静', '雨', '离别'], gradient: 'linear-gradient(135deg, #e3e8ef, #dfe3e8)' },
]

export function getSceneGradient(scene: string, presets?: { keyword: string; gradient: string }[]): { gradient: string; isDark: boolean } | null {
  // Check custom presets first
  if (presets) {
    for (const p of presets) {
      if (scene.includes(p.keyword)) {
        const isDark = p.gradient.includes('#1') || p.gradient.includes('#0')
        return { gradient: p.gradient, isDark }
      }
    }
  }
  // Fallback to built-in themes
  for (const t of SCENE_THEMES) {
    if (t.keywords.some(k => scene.includes(k))) {
      return { gradient: t.gradient, isDark: !!t.isDark }
    }
  }
  return null
}

// ─── Mood map ────────────────────────────────────────────────────────────────

export const MOOD_MAP: Record<MoodType, { emoji: string; label: string; color: string; animation: string; bubbleClass: string }> = {
  happy: { emoji: '😊', label: '开心', color: '#fbbf24', animation: 'mood-glow-breath', bubbleClass: '' },
  thinking: { emoji: '🤔', label: '思考', color: '#60a5fa', animation: 'mood-glow-pulse', bubbleClass: '' },
  sad: { emoji: '😢', label: '难过', color: '#9ca3af', animation: '', bubbleClass: 'animate-bubble-sad' },
  excited: { emoji: '😆', label: '兴奋', color: '#f472b6', animation: 'mood-glow-bounce', bubbleClass: 'animate-bubble-excited' },
  shy: { emoji: '😳', label: '害羞', color: '#fda4af', animation: 'mood-glow-flicker', bubbleClass: 'animate-bubble-shy' },
  angry: { emoji: '😤', label: '生气', color: '#ef4444', animation: '', bubbleClass: 'animate-bubble-angry' },
  neutral: { emoji: '', label: '', color: '', animation: '', bubbleClass: '' },
}

export const GAME_EMOJIS = ['🎯', '💫', '🌟', '🎲', '🎪', '🎨', '🎵', '🔮']
