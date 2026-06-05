export type FieldType =
  | 'text'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'rating'
  | 'file'
  | 'date'
  | 'matrix'
  | 'ranking'
  | 'signature'
  | 'voice'
  | 'nps'
  | 'slider'
  | 'phone'
  | 'email'
  | 'image_choice'
  | 'address'
  | 'section'

export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than'

export interface LogicCondition {
  field: string
  operator: LogicOperator
  value?: string | string[]
}

export interface ShowLogic {
  show_if: LogicCondition
}

export interface ImageOption {
  id: string
  label: string
  imageUrl: string
}

export interface SurveyField {
  id: string
  type: FieldType
  label: string
  description?: string
  required: boolean
  options?: string[]
  placeholder?: string
  logic?: ShowLogic
  // guide content
  guideImage?: string
  guideText?: string
  // text specific
  multiline?: boolean
  maxLength?: number
  // rating specific
  maxRating?: number
  ratingIcon?: 'star' | 'heart' | 'thumb' | 'check' | 'dog' | 'cat'
  // matrix specific
  rows?: string[]
  columns?: string[]
  // file specific
  acceptedTypes?: string
  maxFileSize?: number
  // voice specific
  maxDuration?: number
  // nps specific
  npsLeftLabel?: string
  npsRightLabel?: string
  // slider specific
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  // image choice specific
  imageOptions?: ImageOption[]
  multiSelect?: boolean
  // scoring specific
  optionScores?: Record<string, number>
}

export interface ThemeSettings {
  primaryColor: string
  backgroundColor: string
  fontFamily: 'default' | 'serif' | 'rounded'
  logo?: string
  coverImage?: string
  thankYouMessage: string
  backgroundGradient?: string
}

export interface ScoreRange {
  min: number
  max: number
  label: string
  description: string
}

export interface SurveySettings {
  displayMode: 'page' | 'step' | 'chat'
  password?: string
  deadline?: string  // ISO date string, survey auto-closes after this
  maxResponses?: number  // Max responses allowed
  endingRedirectUrl?: string  // Custom redirect URL after submission
  endingButtonText?: string  // Custom button text on ending page
  endingFollowGuide?: string  // Follow/subscribe guide text
  theme: ThemeSettings
  scoringMode?: boolean
  scoreRanges?: ScoreRange[]
  // Chat mode settings
  chatRole?: string
  chatScene?: string
  chatOpening?: string
  chatPersonality?: string     // 性格描述
  chatTone?: string            // 语气风格
  chatHabit?: string           // 口癖/说话习惯
  chatBackground?: string      // 角色背景故事
  chatAvatarStyle?: 'adventurer' | 'avataaars' | 'lorelei' | 'notionists' | 'personas' | 'bottts'
  chatAvatarUrl?: string                    // 自定义头像原图 URL
  chatAvatarMoodUrls?: Record<string, string>  // 情绪 → 表情立绘 URL 映射
  chatInitialScene?: string      // 初始场景描述，首条消息即触发背景
  chatBondStart?: number         // 亲密度初始值，默认20，范围0-50
  chatBondTierNames?: string[]   // 三阶段名称，默认['初识','渐熟','知己']
  chatBondSpeed?: 'slow' | 'normal' | 'fast'  // 亲密度增长速率
  chatGameUnlock?: Record<string, number>      // 游戏类型 → 解锁所需最低亲密度(0-100)
  chatMilestoneThresholds?: { name: string; threshold: number }[]  // 里程碑自动触发阈值
  chatFeatures?: {
    mood?: boolean      // 情绪系统
    scene?: boolean     // 场景切换
    suggest?: boolean   // 快捷回复
    game?: boolean      // 小游戏
    event?: boolean     // 剧情事件
    choice?: boolean    // 选择卡
    bond?: boolean      // 亲密度
    milestone?: boolean // 里程碑
  }
  // Deep customization for each module
  chatMoodList?: { name: string; emoji: string }[]          // 自定义情绪列表
  chatGameTypes?: ('truth_or_dare' | 'guess' | 'vote' | 'word_chain' | 'quiz' | 'fortune' | 'roleplay' | 'confession')[]   // 可用游戏类型
  chatSuggestCount?: number                                  // 快捷回复数量上限(2-6)
  chatChoiceMax?: number                                     // 选择卡最大选项数(2-4)
  chatMilestoneList?: string[]                               // 预设里程碑名称
  chatEventHints?: string[]                                  // 剧情事件提示/脚本
  chatScenePresets?: { keyword: string; gradient: string }[] // 场景关键词映射
  chatGameConfig?: {
    truth_or_dare?: {
      truths: string[]
      dares: string[]
    }
    quiz?: {
      questions: { q: string; options: string[]; answer: number }[]
    }
    word_chain?: {
      startWords: string[]
      theme?: string
    }
    roleplay?: {
      scenarios: string[]
    }
    fortune?: {
      cards: { name: string; meaning: string }[]
    }
  }
  // Sticker system
  chatStickerPacks?: { name: string; url: string }[]  // 贴纸库：名称→图片URL
  // TTS voice
  chatTtsEnabled?: boolean          // 是否启用语音回复
  chatTtsVoice?: string             // TTS 音色名
  chatTtsMode?: 'auto' | 'custom' | 'keyword'  // auto=读原文, custom=AI生成语音, keyword=关键词触发
  chatVoiceTriggers?: { keyword: string; reply: string }[]  // 关键词→语音内容映射
  // Typing rhythm
  chatTypingEnabled?: boolean       // 是否启用打字节奏
  chatRetractEnabled?: boolean      // 是否启用撤回演出
}

export interface Survey {
  id: string
  title: string
  description: string
  fields: SurveyField[]
  settings: SurveySettings
  status: 'draft' | 'published' | 'closed'
  share_id: string
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  answers: Record<string, unknown>
  submitted_at: string
  metadata: Record<string, unknown>
}

export interface FileRecord {
  id: string
  response_id: string
  field_id: string
  storage_path: string
  file_name: string
  file_size: number
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'admin'
  survey_limit: number
  response_limit: number
  ai_credits: number
  is_admin: boolean
  created_at: string
}

export interface GalleryImage {
  id: string
  url: string
  name: string
  size: number
  created_at: string
}

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    label: '免费版',
    surveys: 5,
    responsesPerSurvey: 50,
    galleryImages: 30,
    aiCredits: 5,
    fieldsPerSurvey: 20,
    fileUploads: 50,
    customTheme: false,
    exportData: false,
  },
  pro: {
    label: 'Pro',
    surveys: 50,
    responsesPerSurvey: Infinity,
    galleryImages: 200,
    aiCredits: 100,
    fieldsPerSurvey: Infinity,
    fileUploads: Infinity,
    customTheme: true,
    exportData: true,
  },
  admin: {
    label: '管理员',
    surveys: Infinity,
    responsesPerSurvey: Infinity,
    galleryImages: Infinity,
    aiCredits: Infinity,
    fieldsPerSurvey: Infinity,
    fileUploads: Infinity,
    customTheme: true,
    exportData: true,
  },
} as const

export const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#4F46E5',
  backgroundColor: '#FFFFFF',
  fontFamily: 'default',
  thankYouMessage: '感谢您的参与！',
}

export const DEFAULT_SETTINGS: SurveySettings = {
  displayMode: 'page',
  theme: DEFAULT_THEME,
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  section: '章节标题',
  text: '文本输入',
  radio: '单选题',
  checkbox: '多选题',
  select: '下拉选择',
  rating: '评分',
  file: '文件上传',
  date: '日期选择',
  matrix: '矩阵题',
  ranking: '排序题',
  signature: '签名',
  voice: '语音留言',
  nps: 'NPS评分',
  slider: '滑块',
  phone: '手机号',
  email: '邮箱',
  image_choice: '图片选择',
  address: '地址',
}

export type TemplateCategory = 'personality' | 'social' | 'fun' | 'utility'

export interface Template {
  id: string
  slug?: string
  title: string
  description: string
  category: TemplateCategory
  cover_image: string | null
  tags: string[]
  fields: SurveyField[]
  settings: SurveySettings
  use_count: number
  is_featured: boolean
  created_at: string
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  personality: '性格测试',
  social: '情感社交',
  fun: '趣味生活',
  utility: '实用工具',
}

export const TEMPLATE_CATEGORY_COLORS: Record<TemplateCategory, string> = {
  personality: '#8b5cf6',
  social: '#ec4899',
  fun: '#f59e0b',
  utility: '#06b6d4',
}
