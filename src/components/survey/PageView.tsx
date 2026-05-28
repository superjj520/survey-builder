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
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-2xl mx-auto">
        {theme.coverImage && (
          <img src={theme.coverImage} alt="" className="w-full h-48 object-cover rounded-t-lg" />
        )}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {theme.logo && (
            <img src={theme.logo} alt="" className="h-10 mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          {description && <p className="text-gray-500 mb-8">{description}</p>}

          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.id}>
                <FieldRenderer
                  field={field}
                  value={answers[field.id]}
                  onChange={(val) => updateAnswer(field.id, val)}
                  theme={theme}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full mt-8"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {submitting ? '提交中...' : '提交'}
          </Button>
        </div>
      </div>
    </div>
  )
}
