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
  displayMode: 'page' | 'step'
  password?: string
  theme: ThemeSettings
  scoringMode?: boolean
  scoreRanges?: ScoreRange[]
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
  plan: 'free' | 'pro' | 'enterprise' | 'admin'
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
