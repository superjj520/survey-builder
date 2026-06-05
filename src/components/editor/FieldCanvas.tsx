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
import {
  AlignJustify, PenLine, CircleDot, CheckSquare, ChevronsUpDown, Star,
  BarChart3, SlidersHorizontal, Image, Paperclip, CalendarDays, Smartphone,
  Mail, MapPin, Grid3X3, ArrowUpDown, PenTool, Mic, GripVertical,
  ChevronUp, ChevronDown, Copy, Trash2, Plus, ArrowLeftRight, CheckCircle2,
  User, MessageCircle, Phone, X, Heart, ThumbsUp
} from 'lucide-react'

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
  { type: 'section', icon: <AlignJustify className="w-4 h-4" />, label: '章节标题', group: '结构' },
  { type: 'text', icon: <PenLine className="w-4 h-4" />, label: '文本输入', group: '基础' },
  { type: 'radio', icon: <CircleDot className="w-4 h-4" />, label: '单选题', group: '基础' },
  { type: 'checkbox', icon: <CheckSquare className="w-4 h-4" />, label: '多选题', group: '基础' },
  { type: 'select', icon: <ChevronsUpDown className="w-4 h-4" />, label: '下拉选择', group: '基础' },
  { type: 'rating', icon: <Star className="w-4 h-4" />, label: '评分', group: '评价' },
  { type: 'nps', icon: <BarChart3 className="w-4 h-4" />, label: 'NPS评分', group: '评价' },
  { type: 'slider', icon: <SlidersHorizontal className="w-4 h-4" />, label: '滑块', group: '评价' },
  { type: 'image_choice', icon: <Image className="w-4 h-4" />, label: '图片选择', group: '高级' },
  { type: 'file', icon: <Paperclip className="w-4 h-4" />, label: '文件上传', group: '高级' },
  { type: 'date', icon: <CalendarDays className="w-4 h-4" />, label: '日期', group: '高级' },
  { type: 'phone', icon: <Smartphone className="w-4 h-4" />, label: '手机号', group: '联系' },
  { type: 'email', icon: <Mail className="w-4 h-4" />, label: '邮箱', group: '联系' },
  { type: 'address', icon: <MapPin className="w-4 h-4" />, label: '地址', group: '联系' },
  { type: 'matrix', icon: <Grid3X3 className="w-4 h-4" />, label: '矩阵题', group: '高级' },
  { type: 'ranking', icon: <ArrowUpDown className="w-4 h-4" />, label: '排序题', group: '高级' },
  { type: 'signature', icon: <PenTool className="w-4 h-4" />, label: '签名', group: '高级' },
  { type: 'voice', icon: <Mic className="w-4 h-4" />, label: '语音留言', group: '高级' },
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
          <GripVertical className="w-5 h-5" />
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
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={moveDown} disabled={isLast} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
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
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => dispatch({ type: 'DUPLICATE_FIELD', payload: field.id })} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="复制">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => dispatch({ type: 'REMOVE_FIELD', payload: field.id })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="删除">
            <Trash2 className="w-4 h-4" />
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
        <ArrowLeftRight className="w-3.5 h-3.5" />
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
          <ArrowLeftRight className="w-3.5 h-3.5" />
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
          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
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
      const RATING_ICONS: { value: string; label: string; preview: React.ReactNode }[] = [
        { value: 'star', label: '星星', preview: <Star className="w-5 h-5" /> },
        { value: 'heart', label: '爱心', preview: <Heart className="w-5 h-5" /> },
        { value: 'thumb', label: '点赞', preview: <ThumbsUp className="w-5 h-5" /> },
        { value: 'check', label: '勾勾', preview: <CheckCircle2 className="w-5 h-5" /> },
        { value: 'dog', label: '小狗', preview: <span className="text-lg">🐕</span> },
        { value: 'cat', label: '小猫', preview: <span className="text-lg">🐱</span> },
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
            <button onClick={() => onChange(options.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity"><X className="w-3 h-3" /></button>
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

// ===== Quick Field Templates =====
const QUICK_TEMPLATES: { label: string; icon: string; lucideIcon?: React.ReactNode; create: () => SurveyField }[] = [
  {
    label: '性别',
    icon: 'user',
    create: () => ({ id: nanoid(8), type: 'radio', label: '你的性别', required: true, options: ['男', '女', '其他'] }),
  },
  {
    label: '年龄段',
    icon: 'calendar',
    create: () => ({ id: nanoid(8), type: 'radio', label: '你的年龄段', required: true, options: ['18岁以下', '18-24岁', '25-34岁', '35-44岁', '45岁以上'] }),
  },
  {
    label: '满意度',
    icon: 'star',
    create: () => ({ id: nanoid(8), type: 'rating', label: '请为本次体验打分', required: true, maxRating: 5, ratingIcon: 'star' }),
  },
  {
    label: '推荐度',
    icon: 'bar-chart',
    create: () => ({ id: nanoid(8), type: 'nps', label: '你有多大可能向朋友推荐我们？', required: false, npsLeftLabel: '完全不会', npsRightLabel: '非常愿意' }),
  },
  {
    label: '联系方式',
    icon: 'phone',
    create: () => ({ id: nanoid(8), type: 'phone', label: '你的手机号', required: false, placeholder: '请输入手机号' }),
  },
  {
    label: '开放建议',
    icon: 'message-circle',
    create: () => ({ id: nanoid(8), type: 'text', label: '你有什么建议或想说的？', required: false, multiline: true, placeholder: '请自由发挥...' }),
  },
]

const QUICK_ICON_MAP: Record<string, React.ReactNode> = {
  'user': <User className="w-5 h-5" />,
  'calendar': <CalendarDays className="w-5 h-5" />,
  'star': <Star className="w-5 h-5" />,
  'bar-chart': <BarChart3 className="w-5 h-5" />,
  'phone': <Phone className="w-5 h-5" />,
  'message-circle': <MessageCircle className="w-5 h-5" />,
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

  const addField = (type: FieldType, prebuilt?: SurveyField) => {
    const limits = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) || 'free']
    if (state.fields.length >= limits.fieldsPerSurvey) {
      alert(`已达题目上限（${limits.fieldsPerSurvey} 题），请升级到 Pro 版`)
      return
    }
    dispatch({ type: 'ADD_FIELD', payload: prebuilt || createField(type) })
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
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-3 z-50 bg-white rounded-xl shadow-xl border p-4 w-[calc(100vw-3rem)] sm:w-72 max-h-80 overflow-y-auto left-1/2 -translate-x-1/2">
            {/* Quick templates */}
            <div className="mb-3">
              <p className="text-xs text-gray-300 mb-1 px-1">常用题</p>
              <div className="grid grid-cols-3 gap-1">
                {QUICK_TEMPLATES.map(tpl => (
                  <button key={tpl.label} onClick={() => { const f = tpl.create(); addField(f.type, f) }} className="flex flex-col items-center gap-1 px-2 py-2.5 text-xs rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-gray-500">
                    <span className="text-indigo-400">{QUICK_ICON_MAP[tpl.icon]}</span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
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
