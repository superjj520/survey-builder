'use client'

import { SurveyField, ThemeSettings } from '@/lib/types'
import { FieldRenderer } from './fields/FieldRenderer'
import { Button } from '@/components/ui/button'

interface PageViewProps {
  fields: SurveyField[]
  answers: Record<string, unknown>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  onSubmit: () => void
  submitting: boolean
  title: string
  description: string
  theme: ThemeSettings
}

export function PageView({ fields, answers, setAnswers, onSubmit, submitting, title, description, theme }: PageViewProps) {
  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  // Calculate question numbers grouped by section
  const fieldNumbers = new Map<string, string>()
  let sectionNum = 0
  let questionInSection = 0
  let hasSections = fields.some(f => f.type === 'section')

  if (hasSections) {
    for (const f of fields) {
      if (f.type === 'section') {
        sectionNum++
        questionInSection = 0
      } else {
        questionInSection++
        fieldNumbers.set(f.id, `${sectionNum}.${questionInSection}`)
      }
    }
  } else {
    let num = 0
    for (const f of fields) {
      num++
      fieldNumbers.set(f.id, `${num}`)
    }
  }

  const totalQuestions = fields.filter(f => f.type !== 'section').length
  const answeredCount = fields.filter(f => {
    if (f.type === 'section') return false
    const v = answers[f.id]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  }).length

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
      <div className="max-w-2xl mx-auto animate-slideUp">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="h-2 w-full" style={{ backgroundColor: theme.primaryColor }} />
          <div className="p-6 sm:p-8">
            {theme.logo && (
              <img src={theme.logo} alt="" className="h-10 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && <p className="text-gray-500 text-sm leading-relaxed">{description}</p>}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs text-red-400">* 表示必填问题</p>
              <p className="text-xs text-gray-300">{answeredCount}/{totalQuestions} 已完成</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>
              <FieldRenderer
                field={field}
                value={answers[field.id]}
                onChange={(val) => updateAnswer(field.id, val)}
                theme={theme}
                questionNumber={fieldNumbers.get(field.id)}
              />
            </div>
          ))}
        </div>

        {/* Submit section */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full sm:w-auto h-12 px-10 rounded-xl text-base font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  提交中...
                </span>
              ) : '提交'}
            </Button>
            <p className="text-xs text-gray-300">请勿在此提交个人敏感信息</p>
          </div>
        </div>
      </div>
    </div>
  )
}
