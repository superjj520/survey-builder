'use client'

import { useState } from 'react'
import { SurveyField, SurveySettings } from '@/lib/types'
import { getVisibleFields } from '@/lib/logic'
import { PageView } from '@/components/survey/PageView'
import { StepView } from '@/components/survey/StepView'

interface SurveyPreviewProps {
  fields: SurveyField[]
  settings: SurveySettings
  title: string
  description: string
}

export function SurveyPreview({ fields, settings, title, description }: SurveyPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [mode, setMode] = useState<'mobile' | 'desktop'>('desktop')

  const visibleFields = getVisibleFields(fields, answers)
  const theme = settings.theme

  const commonProps = {
    fields: visibleFields,
    answers,
    setAnswers,
    onSubmit: () => { /* preview only */ },
    submitting: false,
    title,
    description,
    theme,
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Preview toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-500 font-medium">预览模式</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode('desktop')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'desktop' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            桌面
          </button>
          <button
            onClick={() => setMode('mobile')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'mobile' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            手机
          </button>
        </div>
        <button
          onClick={() => setAnswers({})}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          重置
        </button>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <div
          className={`${mode === 'mobile' ? 'w-[375px] border-[8px] border-gray-800 rounded-[2rem] overflow-hidden shadow-xl' : 'w-full max-w-3xl'}`}
          style={mode === 'mobile' ? { height: 'fit-content', maxHeight: '100%' } : undefined}
        >
          <div className={mode === 'mobile' ? 'overflow-auto h-full' : ''}>
            {settings.displayMode === 'step' ? (
              <StepView {...commonProps} />
            ) : (
              <PageView {...commonProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
