'use client'

import { useState } from 'react'
import { SurveyField, SurveySettings } from '@/lib/types'
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
  const [passwordVerified, setPasswordVerified] = useState(!settings.password)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const visibleFields = getVisibleFields(fields, answers)

  const handleSubmit = async () => {
    // Validate required fields
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

  if (!passwordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-sm w-full text-center">
          <h2 className="text-lg font-medium mb-4">此问卷需要密码访问</h2>
          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="请输入访问密码"
            className="mb-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === settings.password) {
                  setPasswordVerified(true)
                } else {
                  setPasswordError('密码错误')
                }
              }
            }}
          />
          {passwordError && <p className="text-red-500 text-sm mb-3">{passwordError}</p>}
          <Button
            onClick={() => {
              if (passwordInput === settings.password) {
                setPasswordVerified(true)
              } else {
                setPasswordError('密码错误')
              }
            }}
            className="w-full"
          >
            确认
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg">{settings.theme.thankYouMessage}</p>
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
    theme: settings.theme,
  }

  if (settings.displayMode === 'step') {
    return <StepView {...commonProps} />
  }

  return <PageView {...commonProps} />
}
