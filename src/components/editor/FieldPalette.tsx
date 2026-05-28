'use client'

import { useEditor } from './EditorContext'
import { FieldType, FIELD_TYPE_LABELS, SurveyField } from '@/lib/types'
import { nanoid } from 'nanoid'

const FIELD_ICONS: Record<FieldType, string> = {
  text: 'Aa',
  radio: '◉',
  checkbox: '☑',
  select: '▼',
  rating: '★',
  file: '📎',
  date: '📅',
  matrix: '▦',
  ranking: '↕',
  signature: '✍',
  voice: '🎙',
  nps: '📏',
  slider: '⊶',
  phone: '📱',
  email: '✉',
  image_choice: '🖼',
  address: '📍',
}

function createField(type: FieldType): SurveyField {
  const base: SurveyField = {
    id: nanoid(8),
    type,
    label: FIELD_TYPE_LABELS[type],
    required: false,
  }

  switch (type) {
    case 'radio':
    case 'checkbox':
    case 'select':
      return { ...base, options: ['选项 1', '选项 2', '选项 3'] }
    case 'rating':
      return { ...base, maxRating: 5 }
    case 'matrix':
      return { ...base, rows: ['行 1', '行 2'], columns: ['列 1', '列 2', '列 3'] }
    case 'ranking':
      return { ...base, options: ['项目 1', '项目 2', '项目 3'] }
    case 'text':
      return { ...base, multiline: false }
    case 'voice':
      return { ...base, maxDuration: 60 }
    case 'nps':
      return { ...base, npsLeftLabel: '非常不推荐', npsRightLabel: '非常推荐' }
    case 'slider':
      return { ...base, sliderMin: 0, sliderMax: 100, sliderStep: 1 }
    case 'image_choice':
      return { ...base, imageOptions: [{ id: nanoid(6), label: '选项 1', imageUrl: '' }], multiSelect: false }
    default:
      return base
  }
}

export function FieldPalette() {
  const { dispatch } = useEditor()

  const fieldTypes = Object.keys(FIELD_TYPE_LABELS) as FieldType[]

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-3">添加字段</h3>
      <div className="space-y-2">
        {fieldTypes.map((type) => (
          <button
            key={type}
            onClick={() => dispatch({ type: 'ADD_FIELD', payload: createField(type) })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white hover:shadow-sm transition-all text-left"
          >
            <span className="text-lg w-6 text-center">{FIELD_ICONS[type]}</span>
            <span>{FIELD_TYPE_LABELS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
