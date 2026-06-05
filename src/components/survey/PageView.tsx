'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { FieldRenderer } from './fields/FieldRenderer'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

interface PageViewProps {
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

export function PageView({ fields, answers, setAnswers, onSubmit, submitting, title, description, theme, validationErrors }: PageViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [showFab, setShowFab] = useState(false)
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const submitRef = useRef<HTMLDivElement>(null)

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

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

  const isFieldAnswered = useCallback((field: SurveyField) => {
    const v = answers[field.id]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  }, [answers])

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // IntersectionObserver for active field
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveFieldId(entry.target.getAttribute('data-field-id'))
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    )
    fieldRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [fields])

  // FAB visibility - show when submit button is not visible
  useEffect(() => {
    if (!submitRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(submitRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 relative" style={{ background: theme.backgroundGradient || 'linear-gradient(160deg, #eef2ff 0%, #faf5ff 50%, #f0f9ff 100%)' }}>
      {/* Fixed scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-black/5 z-50">
        <div
          className="h-full transition-[width] duration-150 ease-out rounded-r-full"
          style={{ width: `${scrollProgress * 100}%`, background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}aa)` }}
        />
      </div>

      <div className="max-w-2xl mx-auto animate-slideUp">
        {/* Header card */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-5" style={{ boxShadow: `0 4px 16px ${theme.primaryColor}08` }}>
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}aa)` }} />
          <div className="p-6 sm:p-8">
            {theme.logo && (
              <img src={theme.logo} alt="" className="h-10 mb-4" />
            )}
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h1>
            {description && <p className="text-slate-500 text-sm leading-relaxed">{description}</p>}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
              <p className="text-xs text-red-400">* 表示必填问题</p>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`, background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}aa)` }}
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium">{answeredCount}/{totalQuestions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {fields.map((field, index) => {
            const isActive = activeFieldId === field.id
            const isAnswered = field.type !== 'section' && isFieldAnswered(field)
            const hasError = validationErrors?.has(field.id)

            return (
              <div
                key={field.id}
                ref={(el) => { if (el) fieldRefs.current.set(field.id, el) }}
                data-field-id={field.id}
                className={`animate-fadeIn relative ${hasError ? 'animate-shake' : ''}`}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                {/* Active indicator - left accent bar */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-all duration-300 ${
                    hasError ? 'opacity-100 !bg-red-400' : isActive ? 'opacity-100 animate-accentPulse' : 'opacity-0'
                  }`}
                  style={{ backgroundColor: hasError ? undefined : theme.primaryColor }}
                />

                {/* Completion check */}
                {isAnswered && !hasError && (
                  <div
                    className="absolute -right-1 -top-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] z-10 animate-scaleIn shadow-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    ✓
                  </div>
                )}

                {/* Error badge */}
                {hasError && (
                  <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full flex items-center justify-center bg-red-500 text-white text-[10px] z-10 shadow-sm">
                    !
                  </div>
                )}

                <div className={`transition-all duration-300 ${isActive ? 'pl-3' : 'pl-0'} ${hasError ? 'ring-2 ring-red-200 rounded-lg' : ''}`}>
                  <FieldRenderer
                    field={field}
                    value={answers[field.id]}
                    onChange={(val) => updateAnswer(field.id, val)}
                    theme={theme}
                    questionNumber={fieldNumbers.get(field.id)}
                  />
                </div>
                {hasError && (
                  <p className="text-xs text-red-500 mt-1 ml-1">请填写此题</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit section */}
        <div ref={submitRef} className="mt-6 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full sm:w-auto h-12 px-10 rounded-xl text-base font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </span>
              ) : '提交'}
            </Button>
            <p className="text-xs text-gray-300">请勿在此提交个人敏感信息</p>
          </div>
        </div>
      </div>

      {/* Floating submit FAB */}
      {showFab && (
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white animate-floatUp z-40 hover:scale-110 active:scale-95 transition-transform"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Floating progress pill - visible when scrolled past header */}
      {scrollProgress > 0.05 && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-gray-100">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`, backgroundColor: theme.primaryColor }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">{answeredCount}/{totalQuestions}</span>
          </div>
        </div>
      )}
    </div>
  )
}
