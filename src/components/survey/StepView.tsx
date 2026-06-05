'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { FieldRenderer } from './fields/FieldRenderer'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface StepViewProps {
  fields: SurveyField[]
  answers: Record<string, unknown>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  onSubmit: () => void
  submitting: boolean
  title: string
  description: string
  theme: ThemeSettings
  validationErrors?: Set<string>
}

export function StepView({ fields, answers, setAnswers, onSubmit, submitting, title, description, theme, validationErrors }: StepViewProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [autoAdvanceHighlight, setAutoAdvanceHighlight] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null)

  // Calculate question numbers
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

  const currentField = fields[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection('next')
      let nextStep = currentStep + 1
      while (nextStep < totalSteps - 1 && fields[nextStep].type === 'section') {
        nextStep++
      }
      setCurrentStep(nextStep)
    } else {
      onSubmit()
    }
  }, [currentStep, totalSteps, fields, onSubmit])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection('prev')
      let prevStep = currentStep - 1
      while (prevStep > 0 && fields[prevStep].type === 'section') {
        prevStep--
      }
      setCurrentStep(prevStep)
    }
  }, [currentStep, fields])

  const handleNext = useCallback(() => {
    if (currentField.type !== 'section' && currentField.required) {
      const value = answers[currentField.id]
      const isEmpty =
        value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        // Rating: 0 means no selection
        (currentField.type === 'rating' && (value === 0 || value === undefined)) ||
        // NPS: -1 or undefined means no selection
        (currentField.type === 'nps' && (value === -1 || value === undefined || value === null)) ||
        // Slider: undefined means untouched (default display is just visual)
        (currentField.type === 'slider' && value === undefined)
      if (isEmpty) {
        toast.warning(`请填写：${currentField.label}`)
        return
      }
    }
    goNext()
  }, [currentField, answers, goNext])

  const handlePrev = useCallback(() => {
    goPrev()
  }, [goPrev])

  // Auto-advance for radio fields
  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))

    // Auto advance for radio/select/rating/nps after a brief highlight
    const autoAdvanceTypes = ['radio', 'select', 'rating', 'nps']
    if (autoAdvanceTypes.includes(currentField.type)) {
      // For rating, only advance if value > 0 (actual selection)
      if (currentField.type === 'rating' && (value === 0 || value === null)) return
      // For nps, only advance if value >= 0 (actual selection)
      if (currentField.type === 'nps' && (value === -1 || value === null)) return

      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      setAutoAdvanceHighlight(true)
      autoAdvanceTimer.current = setTimeout(() => {
        setAutoAdvanceHighlight(false)
        if (currentStep < totalSteps - 1) {
          goNext()
        }
      }, 600)
    }
  }

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return

    if (deltaX < -50) {
      // Swipe left → next
      handleNext()
    } else if (deltaX > 50) {
      // Swipe right → prev
      handlePrev()
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentField.type !== 'text') {
      e.preventDefault()
      handleNext()
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (currentField.type === 'text') return // don't hijack text input
      e.preventDefault()
      handleNext()
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentField.type === 'text') return
      e.preventDefault()
      handlePrev()
    }
  }

  // Global keyboard listener for arrow keys (works even without focus in form)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNext, handlePrev])

  // Dot indicators - show at most 7 dots around current
  const maxDots = 7
  const dotFields = fields.filter(f => f.type !== 'section')
  const currentDotIndex = dotFields.findIndex(f => f.id === currentField?.id)
  let dotStart = Math.max(0, currentDotIndex - Math.floor(maxDots / 2))
  const dotEnd = Math.min(dotFields.length, dotStart + maxDots)
  if (dotEnd - dotStart < maxDots) dotStart = Math.max(0, dotEnd - maxDots)
  const visibleDots = dotFields.slice(dotStart, dotEnd)

  return (
    <div
      className="h-[100dvh] flex flex-col"
      style={{ background: theme.backgroundGradient || '#f0ebf8' }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="h-1 bg-white/30 flex-shrink-0">
        <div
          className="h-full transition-all duration-700 ease-out rounded-r-full"
          style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }}
        />
      </div>

      {/* Scrollable content */}
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
                  {currentDotIndex + 1}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                共 {totalQuestions} 题
              </span>
            </div>
            <span className="text-xs text-gray-300 bg-white/50 px-3 py-1 rounded-full">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Field card with animation */}
          <div
            key={currentStep}
            className={`transform transition-all duration-300 ease-out ${
              direction === 'next' ? 'animate-slideInRight' : 'animate-slideInLeft'
            } ${autoAdvanceHighlight ? 'ring-2 ring-offset-2 rounded-2xl' : ''} ${validationErrors?.has(currentField.id) ? 'ring-2 ring-red-300 ring-offset-2 rounded-2xl' : ''}`}
            style={autoAdvanceHighlight ? { ['--tw-ring-color' as string]: theme.primaryColor } : undefined}
          >
            <FieldRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={(val) => updateAnswer(currentField.id, val)}
              theme={theme}
              questionNumber={fieldNumbers.get(currentField.id)}
            />
            {validationErrors?.has(currentField.id) && (
              <p className="text-xs text-red-500 mt-2 text-center">请填写此题后继续</p>
            )}
          </div>

          {/* Swipe hint - only on mobile, first question */}
          {currentStep === 0 && (
            <p className="text-center text-xs text-gray-300 mt-6 sm:hidden animate-fadeIn">
              ← 左右滑动切换题目 →
            </p>
          )}
        </div>
      </div>

      {/* Bottom navigation with dot indicators */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-md safe-area-bottom border-t border-slate-100">
        {/* Gradient progress bar at top of nav */}
        <div className="h-[3px] bg-slate-100">
          <div
            className="h-full rounded-r-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}aa)` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center items-center gap-1.5 pt-3 pb-1.5">
          {dotStart > 0 && <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
          {visibleDots.map((f, i) => {
            const globalIdx = dotStart + i
            const isCurrent = globalIdx === currentDotIndex
            const isAnswered = answers[f.id] !== undefined && answers[f.id] !== null && answers[f.id] !== ''
            return isCurrent ? (
              <div
                key={f.id}
                className="flex items-center gap-1.5 bg-indigo-50 rounded-full px-2.5 py-1 transition-all duration-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                <span className="text-[11px] font-bold" style={{ color: theme.primaryColor }}>{currentDotIndex + 1}/{totalQuestions}</span>
              </div>
            ) : (
              <div
                key={f.id}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isAnswered ? `${theme.primaryColor}60` : '#e2e8f0'
                }}
              />
            )
          })}
          {dotEnd < dotFields.length && <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
        </div>

        {/* Buttons */}
        <div className="max-w-xl w-full mx-auto px-4 py-2.5 pb-3 flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 h-[50px] rounded-2xl border-[1.5px] border-slate-200 text-slate-600 font-semibold text-[15px] bg-slate-50 hover:bg-white hover:border-slate-300 disabled:opacity-20 transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            上一题
          </button>
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex-[1.5] h-[50px] rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.97] hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, boxShadow: `0 4px 12px ${theme.primaryColor}30` }}
          >
            {currentStep === totalSteps - 1
              ? submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中
                </span>
              ) : '提交'
              : '下一题'}
            {currentStep < totalSteps - 1 && (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
