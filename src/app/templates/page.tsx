'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAuthenticated, getCurrentUserId } from '@/lib/auth'
import { TemplateCategory, TEMPLATE_CATEGORIES } from '@/lib/types'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { nanoid } from 'nanoid'
import { Sparkles, ClipboardList } from 'lucide-react'

type FilterCategory = 'all' | TemplateCategory

export default function TemplatesPage() {
  const templates = BUILTIN_TEMPLATES
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all')
  const [using, setUsing] = useState<string | null>(null)

  const featured = templates.filter(t => t.is_featured)
  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  const handleUseTemplate = async (templateId: string) => {
    setUsing(templateId)
    try {
      const authed = await isAuthenticated()
      if (!authed) {
        window.location.href = `/admin/?template=${templateId}`
        return
      }

      const template = templates.find(t => t.id === templateId)
      if (!template) {
        toast.error('模板不存在')
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        window.location.href = `/admin/?template=${templateId}`
        return
      }

      // Create new survey from template
      const { data: newSurvey, error } = await supabase.from('surveys').insert({
        user_id: userId,
        title: `${template.title} (副本)`,
        description: template.description,
        fields: template.fields,
        settings: template.settings,
        status: 'draft',
        share_id: nanoid(8),
      }).select().single()

      if (error) {
        toast.error('创建失败: ' + error.message)
        return
      }

      toast.success('模板已应用，正在跳转编辑器...')
      setTimeout(() => {
        window.location.href = `/admin/?edit=${newSurvey.id}`
      }, 500)
    } finally {
      setUsing(null)
    }
  }

  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: '全部' },
    ...Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => ({ key: key as FilterCategory, label })),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">模板库</h1>
            <p className="text-xs text-gray-400 mt-0.5">一键开始你的创意问卷</p>
          </div>
          <a
            href="/admin/"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            进入后台
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Featured Section */}
        {activeCategory === 'all' && featured.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> 精选模板
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {featured.map(template => (
                <div key={template.id} className="w-72 flex-shrink-0">
                  <TemplateCard template={template} onUse={handleUseTemplate} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">暂无模板</p>
              <p className="text-xs text-gray-400 mt-1">模板即将上线，敬请期待</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
