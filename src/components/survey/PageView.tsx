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

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f0ebf8' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="h-3 w-full" style={{ backgroundColor: theme.primaryColor }} />
          <div className="p-6">
            {theme.logo && (
              <img src={theme.logo} alt="" className="h-10 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
            {description && <p className="text-gray-500 text-sm leading-relaxed">{description}</p>}
            <p className="text-xs text-red-400 mt-4">* 表示必填问题</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(val) => updateAnswer(field.id, val)}
              theme={theme}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-between items-center">
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="h-11 px-8 rounded-md text-sm font-medium shadow-sm"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {submitting ? '提交中...' : '提交'}
          </Button>
          <p className="text-xs text-gray-400">请勿通过此表单提交密码</p>
        </div>
      </div>
    </div>
  )
}
