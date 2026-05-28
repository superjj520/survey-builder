'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor } from './EditorContext'
import { SurveyField, FieldType, FIELD_TYPE_LABELS, LogicOperator, ImageOption } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePicker } from './Gallery'
import { nanoid } from 'nanoid'

// ===== Field Creation =====
function createField(type: FieldType): SurveyField {
  const base: SurveyField = { id: nanoid(8), type, label: FIELD_TYPE_LABELS[type], required: false }
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

const FIELD_TYPES: { type: FieldType; icon: string; label: string; group: string }[] = [
  { type: 'text', icon: 'Aa', label: '文本输入', group: '基础' },
  { type: 'radio', icon: '◉', label: '单选题', group: '基础' },
  { type: 'checkbox', icon: '☑', label: '多选题', group: '基础' },
  { type: 'select', icon: '▼', label: '下拉选择', group: '基础' },
  { type: 'rating', icon: '★', label: '评分', group: '评价' },
  { type: 'nps', icon: '📏', label: 'NPS评分', group: '评价' },
  { type: 'slider', icon: '⊶', label: '滑块', group: '评价' },
  { type: 'image_choice', icon: '🖼', label: '图片选择', group: '高级' },
  { type: 'file', icon: '📎', label: '文件上传', group: '高级' },
  { type: 'date', icon: '📅', label: '日期', group: '高级' },
  { type: 'phone', icon: '📱', label: '手机号', group: '联系' },
  { type: 'email', icon: '✉', label: '邮箱', group: '联系' },
  { type: 'address', icon: '📍', label: '地址', group: '联系' },
  { type: 'matrix', icon: '▦', label: '矩阵题', group: '高级' },
  { type: 'ranking', icon: '↕', label: '排序题', group: '高级' },
  { type: 'signature', icon: '✍', label: '签名', group: '高级' },
  { type: 'voice', icon: '🎙', label: '语音留言', group: '高级' },
]

// ===== Sortable Field Card =====
function SortableFieldCard({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const isSelected = state.selectedFieldId === field.id
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} onClick={() => dispatch({ type: 'SELECT_FIELD', payload: field.id })}>
      {isSelected ? (
        <ExpandedFieldCard field={field} dragHandleProps={{ ...attributes, ...listeners }} />
      ) : (
        <CollapsedFieldCard field={field} dragHandleProps={{ ...attributes, ...listeners }} />
      )}
    </div>
  )
}

// ===== Collapsed Card =====
function CollapsedFieldCard({ field, dragHandleProps }: { field: SurveyField; dragHandleProps: Record<string, unknown> }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-center gap-3 px-4 py-3">
        <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/>
            <circle cx="9" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/>
            <circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </p>
        </div>
        {field.logic && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">条件</span>}
        <span className="text-xs text-gray-400 flex-shrink-0">{FIELD_TYPE_LABELS[field.type]}</span>
      </div>
    </div>
  )
}

// ===== Expanded Card =====
function ExpandedFieldCard({ field, dragHandleProps }: { field: SurveyField; dragHandleProps: Record<string, unknown> }) {
  const { dispatch } = useEditor()
  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  return (
    <div className="bg-white rounded-lg border-2 border-indigo-400 shadow-md" onClick={(e) => e.stopPropagation()}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/>
            <circle cx="9" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/>
            <circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/>
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => dispatch({ type: 'DUPLICATE_FIELD', payload: field.id })} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="复制">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button onClick={() => dispatch({ type: 'REMOVE_FIELD', payload: field.id })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="删除">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title + type */}
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              value={field.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full text-base font-medium text-gray-800 border-0 border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-1.5 bg-transparent"
              placeholder="题目标题"
            />
          </div>
          <Select value={field.type} onValueChange={(val) => update({ type: val as FieldType })}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(ft => (
                <SelectItem key={ft.type} value={ft.type}>
                  <span className="mr-1">{ft.icon}</span>{ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <input
          value={field.description || ''}
          onChange={(e) => update({ description: e.target.value || undefined })}
          className="w-full text-sm text-gray-500 border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1 bg-transparent placeholder-gray-300"
          placeholder="说明文字（可选）"
        />

        {/* Type config */}
        <TypeSpecificConfig field={field} update={update} />

        {/* Guide */}
        <GuideSection field={field} update={update} />

        {/* Branch Logic */}
        <BranchLogicSection field={field} />

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            必填
            <Switch checked={field.required} onCheckedChange={(v) => update({ required: v })} />
          </label>
        </div>
      </div>
    </div>
  )
}

// ===== Branch Logic Section =====
function BranchLogicSection({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const [expanded, setExpanded] = useState(!!field.logic)
  const otherFields = state.fields.filter(f => f.id !== field.id)

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  if (otherFields.length === 0) return null

  const OPERATORS: { value: LogicOperator; label: string }[] = [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'greater_than', label: '大于' },
    { value: 'less_than', label: '小于' },
    { value: 'is_empty', label: '为空' },
    { value: 'is_not_empty', label: '不为空' },
  ]

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {field.logic ? '编辑条件逻辑' : '+ 添加条件逻辑'}
      </button>
    )
  }

  const logic = field.logic?.show_if || { field: otherFields[0]?.id || '', operator: 'equals' as LogicOperator, value: '' }
  const sourceField = otherFields.find(f => f.id === logic.field)

  return (
    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          条件显示逻辑
        </span>
        <button onClick={() => { update({ logic: undefined }); setExpanded(false) }} className="text-xs text-gray-400 hover:text-red-400">
          移除
        </button>
      </div>

      <p className="text-xs text-gray-500">当满足以下条件时显示此题目：</p>

      {/* Source field */}
      <Select
        value={logic.field}
        onValueChange={(val) => update({ logic: { show_if: { ...logic, field: val as string } } })}
      >
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择题目" /></SelectTrigger>
        <SelectContent>
          {otherFields.map(f => (
            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={logic.operator}
        onValueChange={(val) => update({ logic: { show_if: { ...logic, operator: val as LogicOperator } } })}
      >
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {OPERATORS.map(op => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value - show options if source is radio/checkbox/select */}
      {!['is_empty', 'is_not_empty'].includes(logic.operator) && (
        sourceField && (sourceField.type === 'radio' || sourceField.type === 'select' || sourceField.type === 'checkbox') ? (
          <Select
            value={(logic.value as string) || ''}
            onValueChange={(val) => update({ logic: { show_if: { ...logic, value: val as string } } })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择值" /></SelectTrigger>
            <SelectContent>
              {(sourceField.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={(logic.value as string) || ''}
            onChange={(e) => update({ logic: { show_if: { ...logic, value: e.target.value } } })}
            placeholder="匹配值"
            className="h-8 text-xs"
          />
        )
      )}

      {/* Apply button if no logic yet */}
      {!field.logic && (
        <button
          onClick={() => update({ logic: { show_if: logic } })}
          className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700"
        >
          应用条件
        </button>
      )}
    </div>
  )
}

// ===== Type Specific Config =====
function TypeSpecificConfig({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <Switch checked={field.multiline || false} onCheckedChange={(v) => update({ multiline: v })} />
            多行文本
          </label>
          <input
            value={field.placeholder || ''}
            onChange={(e) => update({ placeholder: e.target.value })}
            className="w-full text-sm border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-1 bg-transparent placeholder-gray-300"
            placeholder="占位文字（可选）"
          />
        </div>
      )

    case 'radio':
    case 'checkbox':
    case 'select':
    case 'ranking':
      return <OptionsEditor options={field.options || []} onChange={(options) => update({ options })} fieldType={field.type} />

    case 'rating':
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">最高分:</span>
          <input type="number" min={3} max={10} value={field.maxRating || 5} onChange={(e) => update({ maxRating: parseInt(e.target.value) || 5 })} className="w-16 border rounded px-2 py-1 text-sm text-center" />
          <div className="flex gap-0.5">{Array.from({ length: field.maxRating || 5 }).map((_, i) => <span key={i} className="text-lg text-indigo-300">★</span>)}</div>
        </div>
      )

    case 'nps':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">{Array.from({ length: 11 }).map((_, i) => <span key={i} className="w-6 h-6 text-xs rounded bg-gray-100 flex items-center justify-center text-gray-400">{i}</span>)}</div>
          </div>
          <div className="flex gap-3">
            <input value={field.npsLeftLabel || ''} onChange={(e) => update({ npsLeftLabel: e.target.value })} className="flex-1 text-xs border-0 border-b border-dashed border-gray-200 outline-none py-1 bg-transparent placeholder-gray-300" placeholder="左标签（如：非常不推荐）" />
            <input value={field.npsRightLabel || ''} onChange={(e) => update({ npsRightLabel: e.target.value })} className="flex-1 text-xs border-0 border-b border-dashed border-gray-200 outline-none py-1 bg-transparent placeholder-gray-300" placeholder="右标签（如：非常推荐）" />
          </div>
        </div>
      )

    case 'slider':
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">最小:</span>
            <input type="number" value={field.sliderMin ?? 0} onChange={(e) => update({ sliderMin: parseInt(e.target.value) })} className="w-14 border rounded px-2 py-1 text-xs text-center" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">最大:</span>
            <input type="number" value={field.sliderMax ?? 100} onChange={(e) => update({ sliderMax: parseInt(e.target.value) })} className="w-14 border rounded px-2 py-1 text-xs text-center" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">步进:</span>
            <input type="number" value={field.sliderStep ?? 1} onChange={(e) => update({ sliderStep: parseInt(e.target.value) || 1 })} className="w-14 border rounded px-2 py-1 text-xs text-center" />
          </div>
        </div>
      )

    case 'image_choice':
      return <ImageChoiceEditor field={field} update={update} />

    case 'matrix':
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">行（题目）</p>
            <OptionsEditor options={field.rows || []} onChange={(rows) => update({ rows })} fieldType="radio" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">列（选项）</p>
            <OptionsEditor options={field.columns || []} onChange={(columns) => update({ columns })} fieldType="radio" />
          </div>
        </div>
      )

    case 'file':
      return (
        <input value={field.acceptedTypes || ''} onChange={(e) => update({ acceptedTypes: e.target.value })} className="w-full text-sm border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-1 bg-transparent placeholder-gray-300" placeholder="允许的文件类型（如 .pdf,.jpg,.png）" />
      )

    case 'voice':
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">最长录音:</span>
          <input type="number" min={10} max={300} value={field.maxDuration || 60} onChange={(e) => update({ maxDuration: parseInt(e.target.value) || 60 })} className="w-16 border rounded px-2 py-1 text-sm text-center" />
          <span className="text-sm text-gray-400">秒</span>
        </div>
      )

    case 'phone':
    case 'email':
    case 'address':
      return (
        <input value={field.placeholder || ''} onChange={(e) => update({ placeholder: e.target.value })} className="w-full text-sm border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-1 bg-transparent placeholder-gray-300" placeholder="占位文字（可选）" />
      )

    default:
      return null
  }
}

// ===== Image Choice Editor =====
function ImageChoiceEditor({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  const options = field.imageOptions || []

  const updateOption = (idx: number, updates: Partial<ImageOption>) => {
    const newOpts = [...options]
    newOpts[idx] = { ...newOpts[idx], ...updates }
    update({ imageOptions: newOpts })
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
        <Switch checked={field.multiSelect || false} onCheckedChange={(v) => update({ multiSelect: v })} />
        允许多选
      </label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <div key={opt.id} className="border rounded-lg p-2 space-y-2">
            <ImagePicker
              value={opt.imageUrl || undefined}
              onChange={(url) => updateOption(i, { imageUrl: url || '' })}
              label="选择图片"
            />
            <input
              value={opt.label}
              onChange={(e) => updateOption(i, { label: e.target.value })}
              className="w-full text-xs border-0 border-b border-gray-100 focus:border-indigo-300 outline-none py-1 bg-transparent"
              placeholder="选项文字"
            />
            {options.length > 1 && (
              <button onClick={() => update({ imageOptions: options.filter((_, idx) => idx !== i) })} className="text-xs text-red-400 hover:text-red-500">删除</button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => update({ imageOptions: [...options, { id: nanoid(6), label: `选项 ${options.length + 1}`, imageUrl: '' }] })}
        className="text-xs text-indigo-500 hover:text-indigo-600"
      >
        + 添加图片选项
      </button>
    </div>
  )
}

// ===== Options Editor =====
function OptionsEditor({ options, onChange, fieldType }: { options: string[]; onChange: (opts: string[]) => void; fieldType: string }) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="w-5 text-center text-gray-300 flex-shrink-0">
            {fieldType === 'checkbox' ? '☐' : fieldType === 'ranking' ? `${i + 1}.` : '○'}
          </span>
          <input
            value={opt}
            onChange={(e) => { const n = [...options]; n[i] = e.target.value; onChange(n) }}
            className="flex-1 text-sm border-0 border-b border-gray-100 focus:border-indigo-300 outline-none py-1.5 bg-transparent"
          />
          {options.length > 1 && (
            <button onClick={() => onChange(options.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity">✕</button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...options, `选项 ${options.length + 1}`])} className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 py-1 ml-7">+ 添加选项</button>
    </div>
  )
}

// ===== Guide Section =====
function GuideSection({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  const hasGuide = !!(field.guideImage || field.guideText)
  const [show, setShow] = useState(hasGuide)

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-xs text-gray-400 hover:text-indigo-500">+ 添加图文引导</button>
    )
  }

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-600">图文引导</span>
        <button onClick={() => { update({ guideImage: undefined, guideText: undefined }); setShow(false) }} className="text-xs text-gray-400 hover:text-red-400">移除</button>
      </div>
      <ImagePicker value={field.guideImage} onChange={(url) => update({ guideImage: url })} label="引导图片" />
      <Textarea value={field.guideText || ''} onChange={(e) => update({ guideText: e.target.value || undefined })} placeholder="引导说明文字" rows={2} className="text-xs" />
    </div>
  )
}

// ===== Add Field Button =====
function AddFieldButton() {
  const { dispatch } = useEditor()
  const [open, setOpen] = useState(false)

  const addField = (type: FieldType) => {
    dispatch({ type: 'ADD_FIELD', payload: createField(type) })
    setOpen(false)
  }

  // Group field types
  const groups = FIELD_TYPES.reduce((acc, ft) => {
    if (!acc[ft.group]) acc[ft.group] = []
    acc[ft.group].push(ft)
    return acc
  }, {} as Record<string, typeof FIELD_TYPES>)

  return (
    <div className="relative flex justify-center">
      <button onClick={() => setOpen(!open)} className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-3 z-50 bg-white rounded-xl shadow-xl border p-4 w-72 max-h-80 overflow-y-auto">
            <p className="text-xs font-medium text-gray-400 mb-3">选择题目类型</p>
            {Object.entries(groups).map(([group, types]) => (
              <div key={group} className="mb-3">
                <p className="text-xs text-gray-300 mb-1 px-1">{group}</p>
                <div className="grid grid-cols-2 gap-1">
                  {types.map(ft => (
                    <button key={ft.type} onClick={() => addField(ft.type)} className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left">
                      <span className="text-base">{ft.icon}</span>
                      <span>{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ===== Main FieldCanvas =====
export function FieldCanvas() {
  const { state, dispatch } = useEditor()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = state.fields.findIndex((f) => f.id === active.id)
      const newIndex = state.fields.findIndex((f) => f.id === over.id)
      dispatch({ type: 'REORDER_FIELDS', payload: arrayMove(state.fields, oldIndex, newIndex) })
    }
  }

  return (
    <div className="h-full overflow-y-auto" onClick={() => dispatch({ type: 'SELECT_FIELD', payload: null })}>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Title Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="h-2.5 bg-indigo-500" />
          <div className="p-5">
            <input value={state.title} onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })} className="w-full text-xl font-bold text-gray-800 border-0 border-b-2 border-transparent focus:border-indigo-400 outline-none pb-1 bg-transparent" placeholder="问卷标题" />
            <input value={state.description} onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })} className="w-full text-sm text-gray-500 border-0 border-b border-transparent focus:border-gray-300 outline-none py-1.5 mt-2 bg-transparent placeholder-gray-300" placeholder="问卷描述" />
          </div>
        </div>

        {/* Fields */}
        {state.fields.length === 0 ? (
          <div className="text-center py-12 text-gray-400" onClick={(e) => e.stopPropagation()}>
            <p className="text-base mb-1">还没有题目</p>
            <p className="text-sm mb-6">点击下方 + 按钮添加题目</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={state.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {state.fields.map((field) => <SortableFieldCard key={field.id} field={field} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="mt-6" onClick={(e) => e.stopPropagation()}>
          <AddFieldButton />
        </div>
      </div>
    </div>
  )
}
