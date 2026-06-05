'use client'

import { useState } from 'react'
import { Template, TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_COLORS, TemplateCategory } from '@/lib/types'
import { Brain, Heart, Dice5, Wrench } from 'lucide-react'

interface TemplateCardProps {
  template: Template
  onUse: (id: string) => void
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const [imgError, setImgError] = useState(false)
  const categoryColor = TEMPLATE_CATEGORY_COLORS[template.category]
  const categoryLabel = TEMPLATE_CATEGORIES[template.category]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
      {/* Cover */}
      <div className="h-36 relative overflow-hidden">
        {template.cover_image && !imgError ? (
          <img
            src={template.cover_image}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}40)` }}
          >
            <span className="opacity-40" style={{ color: categoryColor }}>
              {template.category === 'personality' ? <Brain className="w-10 h-10" /> :
               template.category === 'social' ? <Heart className="w-10 h-10" /> :
               template.category === 'fun' ? <Dice5 className="w-10 h-10" /> : <Wrench className="w-10 h-10" />}
            </span>
          </div>
        )}
        {/* Category badge */}
        <span
          className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full text-white font-medium backdrop-blur-sm"
          style={{ backgroundColor: `${categoryColor}cc` }}
        >
          {categoryLabel}
        </span>
        {template.is_featured && (
          <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/90 text-white font-medium backdrop-blur-sm">
            精选
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{template.title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2rem]">{template.description}</p>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] text-gray-400">
            {template.use_count > 0 ? `${template.use_count} 人使用` : '全新模板'}
          </span>
          <button
            onClick={() => onUse(template.id)}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: categoryColor }}
          >
            使用模板
          </button>
        </div>
      </div>
    </div>
  )
}
