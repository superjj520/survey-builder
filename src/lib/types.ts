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

export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty'

export interface LogicCondition {
  field: string
  operator: LogicOperator
  value?: string | string[]
}

export interface ShowLogic {
  show_if: LogicCondition
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
  // text specific
  multiline?: boolean
  maxLength?: number
  // rating specific
  maxRating?: number
  // matrix specific
  rows?: string[]
  columns?: string[]
  // file specific
  acceptedTypes?: string
  maxFileSize?: number
}

export interface ThemeSettings {
  primaryColor: string
  backgroundColor: string
  fontFamily: 'default' | 'serif' | 'rounded'
  logo?: string
  coverImage?: string
  thankYouMessage: string
}

export interface SurveySettings {
  displayMode: 'page' | 'step'
  password?: string
  theme: ThemeSettings
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
}
