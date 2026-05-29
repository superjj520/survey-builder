'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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

  // Calculate question numbers grouped by section
  const fieldNumbers = new Map<string, string>()
  let sectionNum = 0
  let questionInSection = 0
  const hasSections = fields.some(f => f.type === 'section')

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
      if (f.type !== 'section') {
        num++
        fieldNumbers.set(f.id, `${num}`)
      }
    }
  }

  const totalQuestions = fields.filter(f => f.type !== 'section').length
  const totalSteps = fields.length

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  const currentField = fields[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (currentField.type !== 'section' && currentField.required) {
      const value = answers[currentField.id]
      if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
        toast.warning(`请填写：${currentField.label}`)
        return
      }
    }
    if (currentStep < totalSteps - 1) {
      setDirection('next')
      // Skip section fields automatically
      let nextStep = currentStep + 1
      while (nextStep < totalSteps - 1 && fields[nextStep].type === 'section') {
        nextStep++
      }
      setCurrentStep(nextStep)
    } else {
      onSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev')
      // Skip section fields when going back
      let prevStep = currentStep - 1
      while (prevStep > 0 && fields[prevStep].type === 'section') {
        prevStep--
      }
      setCurrentStep(prevStep)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentField.type !== 'text') {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: theme.backgroundGradient || '#f0ebf8' }} onKeyDown={handleKeyDown}>
      {/* Progress bar - fixed top */}
      <div className="h-1 bg-white/30 flex-shrink-0">
        <div
          className="h-full transition-all duration-700 ease-out rounded-r-full"
          style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl w-full mx-auto p-4 sm:p-8 pb-6">
          {/* Step counter with progress ring */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={theme.primaryColor}
                    strokeWidth="3"
                    strokeDasharray={`${progress * 0.94} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                  {currentStep + 1}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                共 {totalQuestions} 题
              </span>
            </div>
            <span className="text-xs text-gray-300 bg-white/50 px-3 py-1 rounded-full">
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
              questionNumber={fieldNumbers.get(currentField.id)}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom navigation */}
      <div className="flex-shrink-0 border-t border-white/20 bg-white/80 backdrop-blur-md safe-area-bottom">
        <div className="max-w-xl w-full mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="h-11 px-5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-20 transition-all active:scale-[0.97]"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            上一题
          </Button>
          {currentField.type !== 'text' && (
            <p className="text-xs text-gray-300 hidden sm:block">
              按 Enter 继续
            </p>
          )}
          <Button
            onClick={handleNext}
            disabled={submitting}
            className="h-11 px-7 rounded-xl text-white shadow-md hover:shadow-lg transition-all active:scale-[0.97] font-medium"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {currentStep === totalSteps - 1
              ? submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  提交中
                </span>
              ) : '提交'
              : '下一题'}
            {currentStep < totalSteps - 1 && (
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
