'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'
import { SurveyField, SurveySettings, ThemeSettings, PLAN_LIMITS } from '@/lib/types'
import { getVisibleFields } from '@/lib/logic'
import { supabase } from '@/lib/supabase'
import { PageView } from './PageView'
import { StepView } from './StepView'
import { ChatView } from './ChatView'
import { ShareCard } from './ShareCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Lock, Check } from 'lucide-react'

interface SurveyRendererProps {
  surveyId: string
  fields: SurveyField[]
  settings: SurveySettings
  title: string
  description: string
  showCreatorCTA?: boolean
  templateId?: string
  disableDraft?: boolean
}

export function SurveyRenderer({ surveyId, fields, settings, title, description, showCreatorCTA, templateId, disableDraft }: SurveyRendererProps) {
  const draftKey = `survey_draft_${surveyId}`
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    if (disableDraft || typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(draftKey)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  // Clear validation error when a field gets answered
  const wrappedSetAnswers: typeof setAnswers = (updater) => {
    setAnswers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Find newly answered fields and clear their errors
      if (validationErrors.size > 0) {
        const cleared = new Set(validationErrors)
        for (const id of validationErrors) {
          const v = next[id]
          // Check if the field now has a meaningful value
          const field = fields.find(f => f.id === id)
          const isFilled = v !== undefined && v !== null && v !== '' &&
            !(Array.isArray(v) && v.length === 0) &&
            !(field?.type === 'rating' && v === 0) &&
            !(field?.type === 'nps' && v === -1)
          if (isFilled) {
            cleared.delete(id)
          }
        }
        if (cleared.size !== validationErrors.size) setValidationErrors(cleared)
      }
      return next
    })
  }
  const [passwordVerified, setPasswordVerified] = useState(!settings.password)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Capture channel ref from URL
  const [refChannel] = useState(() => {
    if (typeof window === 'undefined') return undefined
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || undefined
  })

  // Auto-save draft to localStorage
  const saveDraft = useCallback(() => {
    if (disableDraft) return
    if (Object.keys(answers).length > 0) {
      try { localStorage.setItem(draftKey, JSON.stringify(answers)) } catch {}
    }
  }, [answers, draftKey, disableDraft])

  useEffect(() => {
    saveDraft()
  }, [saveDraft])

  // If draft exists, show recovery prompt instead of auto-starting
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved && Object.keys(JSON.parse(saved)).length > 0) {
        setShowDraftPrompt(true)
      }
    } catch {}
  }, [draftKey])

  const visibleFields = getVisibleFields(fields, answers)
  const theme = settings.theme

  // Deadline check
  if (settings.deadline && new Date() > new Date(settings.deadline)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">问卷已截止</h2>
          <p className="text-gray-500 text-sm">本问卷已于 {new Date(settings.deadline).toLocaleString()} 停止收集</p>
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-indigo-500 transition-colors mt-6">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </span>
            趣测小屋 · 免费创建你的测试
          </a>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    const errors = new Set<string>()
    for (const field of visibleFields) {
      if (field.type === 'section') continue
      if (field.required) {
        const value = answers[field.id]
        const isEmpty =
          value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (field.type === 'rating' && (value === 0 || value === undefined)) ||
          (field.type === 'nps' && (value === -1 || value === undefined || value === null)) ||
          (field.type === 'slider' && value === undefined)
        if (isEmpty) {
          errors.add(field.id)
        }
      }
    }
    if (errors.size > 0) {
      setValidationErrors(errors)
      toast.warning('请完成所有必填问题')
      // Scroll to first error
      const firstErrorId = visibleFields.find(f => errors.has(f.id))?.id
      if (firstErrorId) {
        const el = document.querySelector(`[data-field-id="${firstErrorId}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    setValidationErrors(new Set())

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
        const effectiveLimit = settings.maxResponses ? Math.min(limit, settings.maxResponses) : limit
        if (responseCount !== null && responseCount >= effectiveLimit) {
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
          ...(refChannel ? { ref: refChannel } : {}),
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
            <Lock className="w-8 h-8" style={{ color: theme.primaryColor }} />
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

  // Draft recovery prompt
  if (showDraftPrompt && !started && settings.displayMode !== 'chat') {
    const savedCount = Object.keys(answers).length
    const totalCount = fields.filter(f => f.type !== 'section').length
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn" style={{ background: theme.backgroundGradient || '#f0ebf8' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center animate-bounceIn">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '15' }}>
            <Clock className="w-7 h-7" style={{ color: theme.primaryColor }} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">检测到未完成的填写</h2>
          <p className="text-sm text-gray-500 mb-6">您已填写 {savedCount}/{totalCount} 题，要继续吗？</p>
          <div className="space-y-2.5">
            <button
              onClick={() => { setShowDraftPrompt(false); setStarted(true) }}
              className="w-full h-11 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: theme.primaryColor }}
            >
              继续填写
            </button>
            <button
              onClick={() => { setShowDraftPrompt(false); setAnswers({}); try { localStorage.removeItem(draftKey) } catch {} }}
              className="w-full h-11 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              重新开始
            </button>
          </div>
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
      const answer = answers[field.id]
      // Slider fields: use the numeric value directly as score
      if (field.type === 'slider' && typeof answer === 'number') {
        total += answer
        continue
      }
      if (!field.optionScores) continue
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
      <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn relative overflow-hidden" style={{ background: theme.backgroundGradient || 'linear-gradient(160deg, #eef2ff 0%, #faf5ff 50%, #f0f9ff 100%)' }}>
        {/* Decorative background circles */}
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full opacity-30" style={{ background: `${theme.primaryColor}10` }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-52 h-52 rounded-full opacity-20" style={{ background: `${theme.primaryColor}08` }} />
        <Confetti />
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center animate-bounceIn relative z-10" style={{ boxShadow: `0 12px 40px ${theme.primaryColor}12` }}>
          {settings.scoringMode ? (
            <>
              {/* Score card with gradient */}
              <div className="rounded-2xl p-6 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)` }}>
                <div className="text-4xl font-extrabold">{score}分</div>
                <div className="text-sm opacity-85 mt-1">{scoreRange ? scoreRange.label : '测试完成'}</div>
                {settings.scoreRanges && settings.scoreRanges.length > 0 && (
                  <div className="mt-4 bg-white/20 rounded-lg h-1.5">
                    <div className="h-full bg-white rounded-lg transition-all" style={{ width: `${Math.min(100, (score / Math.max(...settings.scoreRanges.map(r => r.max), 100)) * 100)}%` }} />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                {scoreRange ? scoreRange.label : '测试完成！'} 🎉
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-2">
                {scoreRange ? scoreRange.description : `您的得分：${score} 分`}
              </p>
              {settings.scoreRanges && settings.scoreRanges.length > 0 && (
                <div className="flex justify-center gap-1 mt-3 mb-4">
                  {settings.scoreRanges.map((range, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${score >= range.min && score <= range.max ? 'font-bold text-white' : 'text-slate-300 bg-slate-50'}`}
                      style={score >= range.min && score <= range.max ? { backgroundColor: theme.primaryColor } : undefined}
                    >
                      {range.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-22 h-22 mx-auto mb-6 rounded-full flex items-center justify-center animate-scaleIn" style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg, #dcfce7, #d1fae5)', boxShadow: '0 8px 24px rgba(22,163,74,0.15)' }}>
                <Check className="w-11 h-11 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">提交成功！🎉</h2>
              <p className="text-slate-500 text-base leading-relaxed">{theme.thankYouMessage || '感谢您的参与，您的回答已成功提交。'}</p>
            </>
          )}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            {settings.endingButtonText && (
              <a
                href={settings.endingRedirectUrl || '#'}
                target={settings.endingRedirectUrl ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-2xl text-white font-bold text-sm text-center transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, boxShadow: `0 4px 12px ${theme.primaryColor}30` }}
              >
                {settings.endingButtonText}
              </a>
            )}
            <button
              onClick={() => setShowShareCard(true)}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.97] ${settings.endingButtonText ? 'border-[1.5px] border-slate-200 text-slate-600 hover:bg-slate-50' : 'text-white'}`}
              style={settings.endingButtonText ? undefined : { background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, boxShadow: `0 4px 12px ${theme.primaryColor}30` }}
            >
              分享给好友
            </button>
            {settings.endingFollowGuide && (
              <p className="text-sm text-slate-500 text-center pt-2">{settings.endingFollowGuide}</p>
            )}
            {!settings.endingFollowGuide && <p className="text-xs text-slate-300 pt-1">您可以安全关闭此页面</p>}
          </div>

          {/* Viral footer / Creator CTA */}
          {showCreatorCTA ? (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 text-center">
                <p className="text-sm font-bold text-gray-800 mb-1">想做你自己的测试？</p>
                <p className="text-xs text-gray-500 mb-4">免费注册，3分钟就能发布</p>
                <a
                  href={`/admin?template=${templateId || ''}`}
                  className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  免费创建
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-slate-50 text-center">
              <p className="text-[11px] text-slate-300 mb-1">也想做一个测试？</p>
              <a
                href="/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                免费创建 →
              </a>
            </div>
          )}
        </div>
        {showShareCard && (
          <ShareCard
            surveyTitle={title}
            resultLabel={scoreRange ? scoreRange.label : '测试完成'}
            resultDescription={scoreRange ? scoreRange.description : (theme.thankYouMessage || '感谢您的参与！')}
            score={settings.scoringMode ? score : undefined}
            primaryColor={theme.primaryColor}
            shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    )
  }

  const commonProps = {
    fields: visibleFields,
    answers,
    setAnswers: wrappedSetAnswers,
    onSubmit: handleSubmit,
    submitting,
    title,
    description,
    theme,
    validationErrors,
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
    <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn" style={{ background: theme.backgroundGradient || 'linear-gradient(160deg, #eef2ff 0%, #faf5ff 50%, #f0f9ff 100%)' }}>
      <div className="max-w-lg w-full animate-slideUp">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ boxShadow: `0 8px 32px ${theme.primaryColor}12` }}>
          {/* Top accent gradient bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}aa, ${theme.primaryColor})` }} />

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

            {/* Emoji badge */}
            {!theme.coverImage && (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ background: `${theme.primaryColor}10`, boxShadow: `0 2px 8px ${theme.primaryColor}15` }}
              >
                🧠
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight tracking-tight">{title}</h1>

            {description && (
              <p className="text-slate-500 text-base leading-relaxed mb-7">{description}</p>
            )}

            {/* Stats pills */}
            <div className="flex items-center gap-3 mb-7">
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3.5 py-2.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: `${theme.primaryColor}10` }}>
                  📋
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-800">{fieldCount}</div>
                  <div className="text-[11px] text-slate-400">道题</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3.5 py-2.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-green-50">
                  ⏱️
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-800">{estimatedMinutes}分钟</div>
                  <div className="text-[11px] text-slate-400">预计用时</div>
                </div>
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full h-14 rounded-2xl text-lg font-bold text-white transition-all active:scale-[0.97] hover:opacity-90 group"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, boxShadow: `0 4px 16px ${theme.primaryColor}40` }}
            >
              开始测试
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>

            {/* Branding footer */}
            <p className="text-center text-[11px] text-slate-300 mt-5">您的回答将被安全保存</p>
          </div>
        </div>

        <div className="text-center mt-5">
          <span className="text-[11px] text-slate-300">由 趣测小屋 提供技术支持</span>
        </div>
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
