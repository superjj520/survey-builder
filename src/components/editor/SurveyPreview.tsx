'use client'

import { useState, useRef, useEffect } from 'react'
import { SurveyField, SurveySettings } from '@/lib/types'
import { getVisibleFields } from '@/lib/logic'
import { PageView } from '@/components/survey/PageView'
import { StepView } from '@/components/survey/StepView'
import QRCode from 'qrcode'
import { Check, AlertTriangle, Smartphone } from 'lucide-react'

interface SurveyPreviewProps {
  fields: SurveyField[]
  settings: SurveySettings
  title: string
  description: string
  shareId?: string
}

export function SurveyPreview({ fields, settings, title, description, shareId }: SurveyPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [mode, setMode] = useState<'mobile' | 'desktop'>('desktop')
  const [submitted, setSubmitted] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const previewUrl = shareId && typeof window !== 'undefined' ? `${window.location.origin}/s/?id=${shareId}` : ''

  useEffect(() => {
    if (showQR && qrCanvasRef.current && previewUrl) {
      QRCode.toCanvas(qrCanvasRef.current, previewUrl, { width: 180, margin: 2, color: { dark: '#1e1b4b', light: '#ffffff' } })
    }
  }, [showQR, previewUrl])

  const visibleFields = getVisibleFields(fields, answers)
  const theme = settings.theme

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  // Calculate score for preview
  const calculateScore = () => {
    let total = 0
    for (const field of fields) {
      if (!field.optionScores) continue
      const answer = answers[field.id]
      if (typeof answer === 'string') total += field.optionScores[answer] || 0
      else if (Array.isArray(answer)) {
        for (const a of answer) total += field.optionScores[a] || 0
      }
    }
    return total
  }

  const commonProps = {
    fields: visibleFields,
    answers,
    setAnswers,
    onSubmit: handleSubmit,
    submitting: false,
    title,
    description,
    theme,
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Preview toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-500 font-medium">
          预览模式
          {submitted && <span className="ml-2 text-green-600 text-xs">(已提交)</span>}
        </span>
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
        <div className="flex items-center gap-2">
          {shareId && (
            <button
              onClick={() => setShowQR(!showQR)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${showQR ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
              title="手机扫码预览"
            >
              <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> 扫码</span>
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            重置
          </button>
        </div>
      </div>

      {/* QR Code popup */}
      {showQR && previewUrl && (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-center gap-4 flex-shrink-0 animate-fadeIn">
          <canvas ref={qrCanvasRef} className="rounded-lg" />
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">手机扫码预览</p>
            <p>扫描二维码在手机上体验</p>
            <p className="text-[10px] text-gray-400 break-all max-w-[180px]">{previewUrl}</p>
            <p className="text-amber-600 mt-2 flex items-center gap-1 justify-center"><AlertTriangle className="w-3 h-3" /> 需先发布问卷才能扫码填写</p>
          </div>
        </div>
      )}

      {/* Preview frame */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <div
          className={`${mode === 'mobile' ? 'w-[375px] border-[8px] border-gray-800 rounded-[2rem] overflow-hidden shadow-xl' : 'w-full max-w-3xl'}`}
          style={mode === 'mobile' ? { height: 'fit-content', maxHeight: '100%' } : undefined}
        >
          <div className={mode === 'mobile' ? 'overflow-auto h-full' : ''}>
            {submitted ? (
              <PreviewSubmitSuccess theme={theme} title={title} score={settings.scoringMode ? calculateScore() : undefined} settings={settings} onReset={handleReset} />
            ) : settings.displayMode === 'step' ? (
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

function PreviewSubmitSuccess({ theme, title, score, settings, onReset }: { theme: SurveySettings['theme']; title: string; score?: number; settings: SurveySettings; onReset: () => void }) {
  const scoreRange = score !== undefined && settings.scoreRanges
    ? settings.scoreRanges.find(r => score >= r.min && score <= r.max)
    : null

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {score !== undefined ? (
          <>
            <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '15' }}>
              <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{score}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{scoreRange?.label || '测试完成！'}</h2>
            <p className="text-gray-500 text-sm">{scoreRange?.description || `得分：${score} 分`}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-green-50">
              <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">提交成功！</h2>
            <p className="text-gray-500 text-sm">{theme.thankYouMessage || '感谢您的参与'}</p>
          </>
        )}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 mb-3">预览模式 · 不会保存真实回复</p>
          <button onClick={onReset} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">重新填写</button>
        </div>
      </div>
    </div>
  )
}
