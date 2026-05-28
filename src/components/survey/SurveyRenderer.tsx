'use client'

import { useState } from 'react'
import { SurveyField, SurveySettings, ThemeSettings } from '@/lib/types'
import { getVisibleFields } from '@/lib/logic'
import { supabase } from '@/lib/supabase'
import { PageView } from './PageView'
import { StepView } from './StepView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SurveyRendererProps {
  surveyId: string
  fields: SurveyField[]
  settings: SurveySettings
  title: string
  description: string
}

export function SurveyRenderer({ surveyId, fields, settings, title, description }: SurveyRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(!settings.password)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const visibleFields = getVisibleFields(fields, answers)
  const theme = settings.theme

  const handleSubmit = async () => {
    for (const field of visibleFields) {
      if (field.required) {
        const value = answers[field.id]
        if (value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          alert(`请填写：${field.label}`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('responses').insert({
        survey_id: surveyId,
        answers,
        metadata: {
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString(),
        },
      })
      if (!error) {
        setSubmitted(true)
      } else {
        alert('提交失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // Password gate
  if (!passwordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '20' }}>
            <svg className="w-8 h-8" fill={theme.primaryColor} viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">需要密码访问</h2>
          <p className="text-gray-500 text-sm mb-6">请输入访问密码以查看此问卷</p>
          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="请输入访问密码"
            className="mb-3 h-12 text-center text-lg border-0 border-b-2 border-gray-200 rounded-none focus:border-purple-500 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === settings.password) setPasswordVerified(true)
                else setPasswordError('密码错误')
              }
            }}
          />
          {passwordError && <p className="text-red-500 text-sm mb-3">{passwordError}</p>}
          <Button onClick={() => { if (passwordInput === settings.password) setPasswordVerified(true); else setPasswordError('密码错误') }}
            className="w-full h-12 rounded-full text-base font-medium mt-2" style={{ backgroundColor: theme.primaryColor }}>
            确认
          </Button>
        </div>
      </div>
    )
  }

  // Landing page
  if (!started) {
    return <LandingView title={title} description={description} theme={theme} fieldCount={fields.length} onStart={() => setStarted(true)} />
  }

  // Thank you page
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="bg-white rounded-xl shadow-md p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e8f5e9' }}>
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">提交成功</h2>
          <p className="text-gray-500 text-lg">{theme.thankYouMessage}</p>
        </div>
      </div>
    )
  }

  const commonProps = {
    fields: visibleFields,
    answers,
    setAnswers,
    onSubmit: handleSubmit,
    submitting,
    title,
    description,
    theme,
  }

  if (settings.displayMode === 'step') {
    return <StepView {...commonProps} />
  }

  return <PageView {...commonProps} />
}

// Landing Page Component
function LandingView({ title, description, theme, fieldCount, onStart }: {
  title: string
  description: string
  theme: ThemeSettings
  fieldCount: number
  onStart: () => void
}) {
  const estimatedMinutes = Math.max(1, Math.ceil(fieldCount * 0.5))

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0ebf8' }}>
      <div className="max-w-lg w-full">
        {/* Header card with accent bar */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Top accent bar */}
          <div className="h-3 w-full" style={{ backgroundColor: theme.primaryColor }} />

          <div className="p-8">
            {theme.logo && (
              <img src={theme.logo} alt="" className="h-12 mb-6" />
            )}

            {theme.coverImage && (
              <img src={theme.coverImage} alt="" className="w-full h-48 object-cover rounded-lg mb-6" />
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>

            {description && (
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {fieldCount} 道题
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                约 {estimatedMinutes} 分钟
              </span>
            </div>

            <Button
              onClick={onStart}
              className="w-full h-14 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.primaryColor }}
            >
              开始答题
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
