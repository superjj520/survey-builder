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
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
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
      setDirection('next')
      setCurrentStep(currentStep + 1)
    } else {
      onSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0ebf8' }}>
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200/50">
        <div
          className="h-full transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-medium">
              {currentStep + 1} / {totalSteps}
            </span>
            <span className="text-xs text-gray-300">
              {Math.round(progress)}% 已完成
            </span>
          </div>

          {/* Field card with animation */}
          <div
            key={currentStep}
            className={`transform transition-all duration-300 ease-out ${
              direction === 'next' ? 'animate-slideInRight' : 'animate-slideInLeft'
            }`}
          >
            <FieldRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={(val) => updateAnswer(currentField.id, val)}
              theme={theme}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="h-11 px-6 rounded-full border-gray-200 text-gray-600 hover:bg-white disabled:opacity-30"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              上一步
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="h-11 px-6 rounded-full text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {currentStep === totalSteps - 1
                ? submitting ? '提交中...' : '提交'
                : '下一步'}
              {currentStep < totalSteps - 1 && (
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
