'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { SurveyField, SurveySettings, ThemeSettings, PLAN_LIMITS } from '@/lib/types'
import { getVisibleFields } from '@/lib/logic'
import { supabase } from '@/lib/supabase'
import { PageView } from './PageView'
import { StepView } from './StepView'
import { ChatView } from './ChatView'
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
  const draftKey = `survey_draft_${surveyId}`
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(draftKey)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(!settings.password)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Auto-save draft to localStorage
  const saveDraft = useCallback(() => {
    if (Object.keys(answers).length > 0) {
      try { localStorage.setItem(draftKey, JSON.stringify(answers)) } catch {}
    }
  }, [answers, draftKey])

  useEffect(() => {
    saveDraft()
  }, [saveDraft])

  // If draft exists, auto-start (skip landing)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved && Object.keys(JSON.parse(saved)).length > 0) {
        setStarted(true)
      }
    } catch {}
  }, [draftKey])

  const visibleFields = getVisibleFields(fields, answers)
  const theme = settings.theme

  const handleSubmit = async () => {
    for (const field of visibleFields) {
      if (field.type === 'section') continue
      if (field.required) {
        const value = answers[field.id]
        if (value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          toast.warning(`请填写：${field.label}`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const submitKey = `survey_submitted_${surveyId}`
      if (sessionStorage.getItem(submitKey)) {
        setSubmitted(true)
        return
      }
      // Check response limit for survey owner
      const [{ count: responseCount }, { data: surveyData }] = await Promise.all([
        supabase.from('responses').select('id', { count: 'exact', head: true }).eq('survey_id', surveyId),
        supabase.from('surveys').select('user_id').eq('id', surveyId).single(),
      ])
      if (surveyData?.user_id) {
        const { data: ownerProfile } = await supabase.from('profiles').select('plan').eq('id', surveyData.user_id).single()
        const ownerPlan = (ownerProfile?.plan || 'free') as keyof typeof PLAN_LIMITS
        const limit = PLAN_LIMITS[ownerPlan]?.responsesPerSurvey ?? 50
        if (responseCount !== null && responseCount >= limit) {
          toast.error('该问卷回答数已达上限')
          setSubmitting(false)
          return
        }
      }
      const { error } = await supabase.from('responses').insert({
        survey_id: surveyId,
        answers,
        metadata: {
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString(),
        },
      })
      if (!error) {
        sessionStorage.setItem(submitKey, 'true')
        try { localStorage.removeItem(draftKey) } catch {}
        setSubmitted(true)
      } else {
        toast.error('提交失败，请重试')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // Password gate
  if (!passwordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center transform transition-all">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '15' }}>
            <svg className="w-8 h-8" fill={theme.primaryColor} viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">需要密码访问</h2>
          <p className="text-gray-400 text-sm mb-6">请输入访问密码以查看此问卷</p>
          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError('') }}
            placeholder="请输入访问密码"
            className={`mb-3 h-12 text-center text-lg rounded-xl border-2 ${passwordError ? 'border-red-300 animate-shake' : 'border-gray-100'} focus:border-purple-400 transition-colors`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === settings.password) setPasswordVerified(true)
                else setPasswordError('密码错误')
              }
            }}
          />
          {passwordError && <p className="text-red-500 text-sm mb-3 animate-fadeIn">{passwordError}</p>}
          <Button onClick={() => { if (passwordInput === settings.password) setPasswordVerified(true); else setPasswordError('密码错误') }}
            className="w-full h-12 rounded-xl text-base font-medium mt-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]" style={{ backgroundColor: theme.primaryColor }}>
            确认
          </Button>
        </div>
      </div>
    )
  }

  // Landing page (skip for chat mode)
  if (!started && settings.displayMode !== 'chat') {
    const questionCount = fields.filter(f => f.type !== 'section').length
    return <LandingView title={title} description={description} theme={theme} fieldCount={questionCount} onStart={() => setStarted(true)} />
  }

  // Calculate score if scoring mode is enabled
  const calculateScore = () => {
    let total = 0
    for (const field of fields) {
      if (!field.optionScores) continue
      const answer = answers[field.id]
      if (typeof answer === 'string') {
        total += field.optionScores[answer] || 0
      } else if (Array.isArray(answer)) {
        for (const a of answer) {
          total += field.optionScores[a] || 0
        }
      }
    }
    return total
  }

  const getScoreRange = (score: number) => {
    if (!settings.scoreRanges) return null
    return settings.scoreRanges.find(r => score >= r.min && score <= r.max) || null
  }

  // Thank you page
  if (submitted) {
    const score = settings.scoringMode ? calculateScore() : 0
    const scoreRange = settings.scoringMode ? getScoreRange(score) : null

    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn relative overflow-hidden" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
        <Confetti />
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center animate-bounceIn relative z-10">
          {settings.scoringMode ? (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-scaleIn" style={{ backgroundColor: theme.primaryColor + '15' }}>
                <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{score}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {scoreRange ? scoreRange.label : '测试完成！'}
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-4">
                {scoreRange ? scoreRange.description : `您的得分：${score} 分`}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">总分</span>
                  <span className="font-bold text-lg" style={{ color: theme.primaryColor }}>{score} 分</span>
                </div>
                {settings.scoreRanges && settings.scoreRanges.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex gap-1">
                      {settings.scoreRanges.map((range, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full ${score >= range.min && score <= range.max ? 'opacity-100' : 'opacity-30'}`}
                          style={{ backgroundColor: theme.primaryColor }}
                          title={`${range.label}: ${range.min}-${range.max}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {settings.scoreRanges.map((range, i) => (
                        <span key={i} className={`text-[10px] ${score >= range.min && score <= range.max ? 'font-bold text-gray-700' : 'text-gray-300'}`}>
                          {range.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-scaleIn" style={{ backgroundColor: '#dcfce7' }}>
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">提交成功！</h2>
              <p className="text-gray-500 text-base leading-relaxed">{theme.thankYouMessage || '感谢您的参与，您的回答已成功提交。'}</p>
            </>
          )}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-300">您可以安全关闭此页面</p>
          </div>
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

  if (settings.displayMode === 'chat') {
    return (
      <ChatView
        fields={fields}
        answers={answers}
        setAnswers={setAnswers}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={title}
        description={description}
        theme={theme}
        chatRole={settings.chatRole}
        chatScene={settings.chatScene}
        chatOpening={settings.chatOpening}
        chatPersonality={settings.chatPersonality}
        chatTone={settings.chatTone}
        chatHabit={settings.chatHabit}
        chatBackground={settings.chatBackground}
        chatAvatarStyle={settings.chatAvatarStyle}
        chatAvatarUrl={settings.chatAvatarUrl}
        chatAvatarMoodUrls={settings.chatAvatarMoodUrls}
        chatInitialScene={settings.chatInitialScene}
        chatBondStart={settings.chatBondStart}
        chatBondTierNames={settings.chatBondTierNames}
        chatFeatures={settings.chatFeatures}
        chatMoodList={settings.chatMoodList}
        chatGameTypes={settings.chatGameTypes}
        chatSuggestCount={settings.chatSuggestCount}
        chatChoiceMax={settings.chatChoiceMax}
        chatMilestoneList={settings.chatMilestoneList}
        chatEventHints={settings.chatEventHints}
        chatGameConfig={settings.chatGameConfig as Record<string, unknown>}
        chatBondSpeed={settings.chatBondSpeed}
        chatGameUnlock={settings.chatGameUnlock}
        chatMilestoneThresholds={settings.chatMilestoneThresholds}
        chatScenePresets={settings.chatScenePresets}
        chatStickerPacks={settings.chatStickerPacks}
        chatTtsEnabled={settings.chatTtsEnabled}
        chatTtsVoice={settings.chatTtsVoice}
        chatTtsMode={settings.chatTtsMode}
        chatVoiceTriggers={settings.chatVoiceTriggers}
        chatTypingEnabled={settings.chatTypingEnabled}
        chatRetractEnabled={settings.chatRetractEnabled}
        surveyId={surveyId}
      />
    )
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
    <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
      <div className="max-w-lg w-full animate-slideUp">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top accent bar */}
          <div className="h-2 w-full" style={{ backgroundColor: theme.primaryColor }} />

          <div className="p-8 sm:p-10">
            {theme.logo && (
              <img src={theme.logo} alt="" className="h-10 mb-6 animate-fadeIn" />
            )}

            {theme.coverImage && (
              <div className="relative -mx-10 -mt-10 mb-8">
                <img src={theme.coverImage} alt="" className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{title}</h1>

            {description && (
              <p className="text-gray-500 text-base leading-relaxed mb-8">{description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-400 mb-8">
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </span>
                {fieldCount} 道题
              </span>
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                约 {estimatedMinutes} 分钟
              </span>
            </div>

            <Button
              onClick={onStart}
              className="w-full h-14 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
              style={{ backgroundColor: theme.primaryColor }}
            >
              开始答题
              <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">您的回答将被安全保存</p>
      </div>
    </div>
  )
}

// Confetti animation component
function Confetti() {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}
