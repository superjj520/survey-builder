'use client'

import { ChoiceOption } from '@/lib/marker-parser'
import { ThemeSettings } from '@/lib/types'

interface ChoiceCardsProps {
  choices: ChoiceOption[]
  isDarkScene: boolean
  theme: ThemeSettings
  onSelect: (text: string, hint: string) => void
}

export function ChoiceCards({ choices, isDarkScene, theme, onSelect }: ChoiceCardsProps) {
  return (
    <div className={`flex-shrink-0 px-4 py-3 border-t ${isDarkScene ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-100'}`}>
      <div className="max-w-lg mx-auto space-y-2">
        {choices.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(opt.text, opt.hint || '')}
            className="animate-choiceCardIn w-full text-left rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
            style={{
              animationDelay: `${i * 100}ms`,
              backgroundColor: isDarkScene ? 'rgba(255,255,255,0.08)' : '#fff',
              border: `1px solid ${isDarkScene ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>
                {i + 1}
              </span>
              <div>
                <p className={`text-sm font-medium ${isDarkScene ? 'text-white' : 'text-gray-800'}`}>{opt.text}</p>
                {opt.hint && <p className={`text-xs mt-0.5 ${isDarkScene ? 'text-gray-400' : 'text-gray-400'}`}>{opt.hint}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
