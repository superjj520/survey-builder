'use client'

import { useState } from 'react'
import { getTemplateBySlug } from '@/lib/templates'
import { SurveyRenderer } from '@/components/survey/SurveyRenderer'
import { FileText, Users, Clock, Play } from 'lucide-react'

export function LandingPageClient({ slug }: { slug: string }) {
  const template = getTemplateBySlug(slug)
  const [started, setStarted] = useState(false)

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">模板不存在</p>
      </div>
    )
  }

  const theme = template.settings.theme || { primaryColor: '#6366f1' }
  const primaryColor = theme.primaryColor || '#6366f1'
  const minutes = Math.ceil(template.fields.length * 0.4)

  if (started) {
    return (
      <SurveyRenderer
        surveyId={`lp_${template.id}`}
        fields={template.fields}
        settings={template.settings}
        title={template.title}
        description={template.description}
        showCreatorCTA={true}
        templateId={template.id}
        disableDraft={true}
      />
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: theme.backgroundGradient || `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}30)` }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-20" style={{ background: primaryColor }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full opacity-10" style={{ background: primaryColor }} />

      {/* Content */}
      <div className="relative z-10 max-w-sm w-full text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-1.5 mb-10 opacity-60">
          <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-500">趣测小屋</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {template.title}
        </h1>
        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {template.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-8">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.fields.length}题 · 约{minutes}分钟
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.use_count} 人已参与
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setStarted(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}40` }}
        >
          <Play className="w-5 h-5" fill="white" />
          开始测试
        </button>
      </div>
    </div>
  )
}
