'use client'

import { useState } from 'react'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { FieldRenderer } from './fields/FieldRenderer'
import { Button } from '@/components/ui/button'

interface StepViewProps {
  fields: SurveyField[]
  answers: Record<string, unknown>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  onSubmit: () => void
  submitting: boolean
  title: string
  description: string
  theme: ThemeSettings
}

export function StepView({ fields, answers, setAnswers, onSubmit, submitting, title, description, theme }: StepViewProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = fields.length

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  const currentField = fields[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (currentField.required) {
      const value = answers[currentField.id]
      if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
        alert(`请填写：${currentField.label}`)
        return
      }
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onSubmit()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          {currentStep === 0 && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              {description && <p className="text-gray-500">{description}</p>}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-sm text-gray-400 mb-4">
              {currentStep + 1} / {totalSteps}
            </div>

            <FieldRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={(val) => updateAnswer(currentField.id, val)}
              theme={theme}
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              上一步
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitting}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {currentStep === totalSteps - 1
                ? submitting ? '提交中...' : '提交'
                : '下一步'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
