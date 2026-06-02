'use client'

import React, { useState, useEffect } from 'react'
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
import { SurveyField, FieldType, FIELD_TYPE_LABELS, LogicOperator, ImageOption, PLAN_LIMITS } from '@/lib/types'
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

const FIELD_TYPES: { type: FieldType; icon: React.ReactNode; label: string; group: string }[] = [
  { type: 'section', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16"/></svg>, label: '章节标题', group: '结构' },
  { type: 'text', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>, label: '文本输入', group: '基础' },
  { type: 'radio', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>, label: '单选题', group: '基础' },
  { type: 'checkbox', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12l3 3 5-5"/></svg>, label: '多选题', group: '基础' },
  { type: 'select', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>, label: '下拉选择', group: '基础' },
  { type: 'rating', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, label: '评分', group: '评价' },
  { type: 'nps', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>, label: 'NPS评分', group: '评价' },
  { type: 'slider', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16"/><circle cx="14" cy="12" r="3" strokeWidth={2} fill="white"/></svg>, label: '滑块', group: '评价' },
  { type: 'image_choice', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16l5-5 4 4 5-5 4 4"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/></svg>, label: '图片选择', group: '高级' },
  { type: 'file', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>, label: '文件上传', group: '高级' },
  { type: 'date', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18"/></svg>, label: '日期', group: '高级' },
  { type: 'phone', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2}/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>, label: '手机号', group: '联系' },
  { type: 'email', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 6l-10 7L2 6"/></svg>, label: '邮箱', group: '联系' },
  { type: 'address', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, label: '地址', group: '联系' },
  { type: 'matrix', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18"/></svg>, label: '矩阵题', group: '高级' },
  { type: 'ranking', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4"/></svg>, label: '排序题', group: '高级' },
  { type: 'signature', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>, label: '签名', group: '高级' },
  { type: 'voice', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"/></svg>, label: '语音留言', group: '高级' },
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
  const { state, dispatch } = useEditor()
  const index = state.fields.findIndex(f => f.id === field.id)
  const isFirst = index === 0
  const isLast = index === state.fields.length - 1

  // Calculate display number
  let displayNum = ''
  if (field.type !== 'section') {
    const hasSections = state.fields.some(f => f.type === 'section')
    if (hasSections) {
      let secNum = 0, qNum = 0
      for (let i = 0; i <= index; i++) {
        if (state.fields[i].type === 'section') { secNum++; qNum = 0 }
        else { qNum++ }
      }
      displayNum = `${secNum}.${qNum}`
    } else {
      let qNum = 0
      for (let i = 0; i <= index; i++) {
        if (state.fields[i].type !== 'section') qNum++
      }
      displayNum = `${qNum}`
    }
  }

  const moveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isFirst) {
      const newFields = [...state.fields]
      ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
      dispatch({ type: 'REORDER_FIELDS', payload: newFields })
    }
  }

  const moveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLast) {
      const newFields = [...state.fields]
      ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
      dispatch({ type: 'REORDER_FIELDS', payload: newFields })
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer ${field.type === 'section' ? 'border-l-4 border-l-indigo-400' : ''}`}>
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
            {field.type === 'section' && <span className="text-indigo-500 mr-1">§</span>}
            {displayNum && <span className="text-gray-400 mr-1">{displayNum}</span>}
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </p>
        </div>
        {field.logic && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex-shrink-0" title="此题有跳转条件">跳转</span>}
        <span className="text-xs text-gray-400 flex-shrink-0">{FIELD_TYPE_LABELS[field.type]}</span>
        {/* Move buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={moveUp} disabled={isFirst} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
          </button>
          <button onClick={moveDown} disabled={isLast} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
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
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          <div className="flex-1">
            <input
              value={field.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full text-base font-medium text-gray-800 border-0 border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-1.5 bg-transparent"
              placeholder="题目标题"
            />
          </div>
          <Select value={field.type} onValueChange={(val) => update({ type: val as FieldType })}>
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(ft => (
                <SelectItem key={ft.type} value={ft.type}>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-400">{ft.icon}</span>
                    <span>{ft.label}</span>
                  </span>
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

  // Only show fields that come BEFORE this field (logic looks backward)
  const currentIndex = state.fields.findIndex(f => f.id === field.id)
  const precedingFields = state.fields.slice(0, currentIndex).filter(f => f.type !== 'section')

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  if (precedingFields.length === 0) return null

  const OPERATORS: { value: LogicOperator; label: string; types: string[] }[] = [
    { value: 'equals', label: '等于', types: ['radio', 'select', 'text', 'rating', 'nps', 'slider', 'phone', 'email'] },
    { value: 'not_equals', label: '不等于', types: ['radio', 'select', 'text', 'rating', 'nps', 'slider'] },
    { value: 'contains', label: '包含', types: ['checkbox', 'text'] },
    { value: 'greater_than', label: '大于', types: ['rating', 'nps', 'slider'] },
    { value: 'less_than', label: '小于', types: ['rating', 'nps', 'slider'] },
    { value: 'is_empty', label: '为空', types: ['text', 'radio', 'checkbox', 'select', 'rating', 'nps', 'slider', 'phone', 'email', 'date', 'file', 'address'] },
    { value: 'is_not_empty', label: '不为空', types: ['text', 'radio', 'checkbox', 'select', 'rating', 'nps', 'slider', 'phone', 'email', 'date', 'file', 'address'] },
  ]

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1.5 py-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        {field.logic ? '编辑跳转逻辑' : '+ 添加跳转逻辑'}
      </button>
    )
  }

  const logic = field.logic?.show_if || { field: precedingFields[0]?.id || '', operator: 'equals' as LogicOperator, value: '' }
  const sourceField = precedingFields.find(f => f.id === logic.field)

  // Filter operators by source field type
  const availableOperators = sourceField
    ? OPERATORS.filter(op => op.types.includes(sourceField.type))
    : OPERATORS

  // Auto-apply logic on change (no separate "apply" button needed)
  const setLogic = (newLogic: typeof logic) => {
    update({ logic: { show_if: newLogic } })
  }

  // Human-readable summary
  const getSummary = () => {
    if (!field.logic?.show_if) return ''
    const src = precedingFields.find(f => f.id === field.logic!.show_if.field)
    if (!src) return ''
    const op = OPERATORS.find(o => o.value === field.logic!.show_if.operator)
    const val = field.logic!.show_if.value
    if (field.logic!.show_if.operator === 'is_empty') return `「${src.label}」为空时显示`
    if (field.logic!.show_if.operator === 'is_not_empty') return `「${src.label}」不为空时显示`
    return `「${src.label}」${op?.label || ''} "${val}" 时显示`
  }

  return (
    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          跳转逻辑
        </span>
        <button onClick={() => { update({ logic: undefined }); setExpanded(false) }} className="text-xs text-gray-400 hover:text-red-400">
          移除
        </button>
      </div>

      <p className="text-xs text-gray-500">当满足条件时，此题才会显示：</p>

      {/* Source field - only preceding fields */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400">当</label>
        <Select
          value={logic.field}
          onValueChange={(val) => {
            if (!val) return
            const newSource = precedingFields.find(f => f.id === val)
            const newOp = newSource && OPERATORS.filter(op => op.types.includes(newSource.type))[0]
            setLogic({ field: val, operator: newOp?.value || 'equals', value: '' })
          }}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择前置题目" /></SelectTrigger>
          <SelectContent>
            {precedingFields.map(f => (
              <SelectItem key={f.id} value={f.id}>
                <span className="text-gray-400 mr-1">{FIELD_TYPE_LABELS[f.type]}</span>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400">的回答</label>
        <Select
          value={logic.operator}
          onValueChange={(val) => setLogic({ ...logic, operator: val as LogicOperator, value: ['is_empty', 'is_not_empty'].includes(val || '') ? '' : logic.value })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableOperators.map(op => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value */}
      {!['is_empty', 'is_not_empty'].includes(logic.operator) && (
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">值</label>
          {sourceField && (sourceField.type === 'radio' || sourceField.type === 'select') ? (
            <Select
              value={(logic.value as string) || ''}
              onValueChange={(val) => setLogic({ ...logic, value: val || '' })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择值" /></SelectTrigger>
              <SelectContent>
                {(sourceField.options || []).map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : sourceField && sourceField.type === 'checkbox' ? (
            <Select
              value={(logic.value as string) || ''}
              onValueChange={(val) => setLogic({ ...logic, value: val || '' })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="包含哪个选项" /></SelectTrigger>
              <SelectContent>
                {(sourceField.options || []).map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : sourceField && ['rating', 'nps', 'slider'].includes(sourceField.type) ? (
            <Input
              type="number"
              value={(logic.value as string) || ''}
              onChange={(e) => setLogic({ ...logic, value: e.target.value })}
              placeholder={sourceField.type === 'nps' ? '0-10' : sourceField.type === 'rating' ? `1-${sourceField.maxRating || 5}` : '数值'}
              className="h-8 text-xs"
            />
          ) : (
            <Input
              value={(logic.value as string) || ''}
              onChange={(e) => setLogic({ ...logic, value: e.target.value })}
              placeholder="输入匹配值"
              className="h-8 text-xs"
            />
          )}
        </div>
      )}

      {/* Summary */}
      {field.logic?.show_if && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-amber-200">
          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span className="text-[11px] text-gray-600">{getSummary()}</span>
        </div>
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
      return <OptionsEditor options={field.options || []} onChange={(options) => update({ options })} fieldType={field.type} field={field} update={update} />

    case 'rating':
      const RATING_ICONS = [
        { value: 'star', label: '星星', preview: '★' },
        { value: 'heart', label: '爱心', preview: '♥' },
        { value: 'thumb', label: '点赞', preview: '👍' },
        { value: 'check', label: '勾勾', preview: '✓' },
        { value: 'dog', label: '小狗', preview: '🐕' },
        { value: 'cat', label: '小猫', preview: '🐱' },
      ]
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">最高分:</span>
            <input type="number" min={3} max={10} value={field.maxRating || 5} onChange={(e) => update({ maxRating: parseInt(e.target.value) || 5 })} className="w-16 border rounded px-2 py-1 text-sm text-center" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">图标:</span>
            {RATING_ICONS.map(icon => (
              <button
                key={icon.value}
                onClick={() => update({ ratingIcon: icon.value as SurveyField['ratingIcon'] })}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  (field.ratingIcon || 'star') === icon.value
                    ? 'bg-indigo-100 border-2 border-indigo-400 scale-110'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
                title={icon.label}
              >
                {icon.preview}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">填写时：镂空表示未选中，实心表示已选中</p>
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
function OptionsEditor({ options, onChange, fieldType, field, update }: { options: string[]; onChange: (opts: string[]) => void; fieldType: string; field?: SurveyField; update?: (u: Partial<SurveyField>) => void }) {
  const { state } = useEditor()
  const scoringMode = state.settings.scoringMode
  const optionScores = field?.optionScores || {}

  const updateScore = (opt: string, score: number) => {
    if (!update) return
    update({ optionScores: { ...optionScores, [opt]: score } })
  }

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const n = [...options]
                n.splice(i + 1, 0, `选项 ${options.length + 1}`)
                onChange(n)
                setTimeout(() => {
                  const inputs = e.currentTarget.closest('.space-y-2')?.querySelectorAll('input[type="text"], input:not([type])') as NodeListOf<HTMLInputElement> | undefined
                  inputs?.[i + 1]?.focus()
                }, 50)
              }
              if (e.key === 'Backspace' && opt === '' && options.length > 1) {
                e.preventDefault()
                onChange(options.filter((_, idx) => idx !== i))
              }
            }}
            className="flex-1 text-sm border-0 border-b border-gray-100 focus:border-indigo-300 outline-none py-1.5 bg-transparent"
          />
          {scoringMode && update && (
            <input
              type="number"
              value={optionScores[opt] ?? ''}
              onChange={(e) => updateScore(opt, parseInt(e.target.value) || 0)}
              className="w-12 h-7 text-xs text-center border border-orange-200 rounded bg-orange-50 focus:border-orange-400 outline-none"
              placeholder="分"
              title="该选项分值"
            />
          )}
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
  const { state, dispatch } = useEditor()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<string>('free')

  useEffect(() => {
    import('@/lib/auth').then(({ getProfile }) => {
      getProfile().then(p => { if (p) setPlan(p.plan) })
    })
  }, [])

  const addField = (type: FieldType) => {
    const limits = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) || 'free']
    if (state.fields.length >= limits.fieldsPerSurvey) {
      alert(`已达题目上限（${limits.fieldsPerSurvey} 题），请升级到 Pro 版`)
      return
    }
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
          <div className="absolute bottom-full mb-3 z-50 bg-white rounded-xl shadow-xl border p-4 w-[calc(100vw-3rem)] sm:w-72 max-h-80 overflow-y-auto left-1/2 -translate-x-1/2">
            <p className="text-xs font-medium text-gray-400 mb-3">选择题目类型</p>
            {Object.entries(groups).map(([group, types]) => (
              <div key={group} className="mb-3">
                <p className="text-xs text-gray-300 mb-1 px-1">{group}</p>
                <div className="grid grid-cols-2 gap-1">
                  {types.map(ft => (
                    <button key={ft.type} onClick={() => addField(ft.type)} className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left">
                      <span className="text-gray-400 flex-shrink-0">{ft.icon}</span>
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
            <p className="text-base mb-1">暂无题目</p>
            <p className="text-sm mb-6">点击下方按钮开始创建</p>
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
