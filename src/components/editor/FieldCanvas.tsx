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
import { SurveyField, FieldType, FIELD_TYPE_LABELS } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    default:
      return base
  }
}

const FIELD_TYPES: { type: FieldType; icon: string; label: string }[] = [
  { type: 'text', icon: 'Aa', label: '文本输入' },
  { type: 'radio', icon: '◉', label: '单选题' },
  { type: 'checkbox', icon: '☑', label: '多选题' },
  { type: 'select', icon: '▼', label: '下拉选择' },
  { type: 'rating', icon: '★', label: '评分' },
  { type: 'file', icon: '📎', label: '文件上传' },
  { type: 'date', icon: '📅', label: '日期' },
  { type: 'matrix', icon: '▦', label: '矩阵题' },
  { type: 'ranking', icon: '↕', label: '排序题' },
  { type: 'signature', icon: '✍', label: '签名' },
  { type: 'voice', icon: '🎙', label: '语音留言' },
]

// ===== Sortable Field Card =====
function SortableFieldCard({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const isSelected = state.selectedFieldId === field.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const selectThis = () => {
    dispatch({ type: 'SELECT_FIELD', payload: field.id })
  }

  return (
    <div ref={setNodeRef} style={style} onClick={selectThis}>
      {isSelected ? (
        <ExpandedFieldCard field={field} dragHandleProps={{ ...attributes, ...listeners }} />
      ) : (
        <CollapsedFieldCard field={field} dragHandleProps={{ ...attributes, ...listeners }} />
      )}
    </div>
  )
}

// ===== Collapsed Card (not selected) =====
function CollapsedFieldCard({ field, dragHandleProps }: { field: SurveyField; dragHandleProps: Record<string, unknown> }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <button
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/>
            <circle cx="9" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/>
            <circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/>
          </svg>
        </button>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{FIELD_TYPE_LABELS[field.type]}</span>
      </div>
    </div>
  )
}

// ===== Expanded Card (selected, editable) =====
function ExpandedFieldCard({ field, dragHandleProps }: { field: SurveyField; dragHandleProps: Record<string, unknown> }) {
  const { dispatch } = useEditor()

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  return (
    <div className="bg-white rounded-lg border-2 border-indigo-400 shadow-md" onClick={(e) => e.stopPropagation()}>
      {/* Top bar with drag handle and actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/>
            <circle cx="9" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/>
            <circle cx="9" cy="20" r="1.5"/><circle cx="15" cy="20" r="1.5"/>
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'DUPLICATE_FIELD', payload: field.id })}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
            title="复制题目"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => dispatch({ type: 'REMOVE_FIELD', payload: field.id })}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="删除题目"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title row + type selector */}
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
            <SelectTrigger className="w-28 h-9 text-xs">
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

        {/* Type-specific config */}
        <TypeSpecificConfig field={field} update={update} />

        {/* Guide config */}
        <GuideSection field={field} update={update} />

        {/* Bottom: required switch */}
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
          {field.maxLength !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>最大字数:</span>
              <input type="number" value={field.maxLength} onChange={(e) => update({ maxLength: parseInt(e.target.value) || undefined })} className="w-20 border rounded px-2 py-1 text-sm" />
            </div>
          )}
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
          <input
            type="number" min={3} max={10}
            value={field.maxRating || 5}
            onChange={(e) => update({ maxRating: parseInt(e.target.value) || 5 })}
            className="w-16 border rounded px-2 py-1 text-sm text-center"
          />
          <div className="flex gap-0.5">
            {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
              <span key={i} className="text-lg text-indigo-300">★</span>
            ))}
          </div>
        </div>
      )

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
        <input
          value={field.acceptedTypes || ''}
          onChange={(e) => update({ acceptedTypes: e.target.value })}
          className="w-full text-sm border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-1 bg-transparent placeholder-gray-300"
          placeholder="允许的文件类型（如 .pdf,.jpg,.png）"
        />
      )

    case 'voice':
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">最长录音:</span>
          <input
            type="number" min={10} max={300}
            value={field.maxDuration || 60}
            onChange={(e) => update({ maxDuration: parseInt(e.target.value) || 60 })}
            className="w-16 border rounded px-2 py-1 text-sm text-center"
          />
          <span className="text-sm text-gray-400">秒</span>
        </div>
      )

    case 'date':
    case 'signature':
    default:
      return null
  }
}

// ===== Options Editor =====
function OptionsEditor({ options, onChange, fieldType }: { options: string[]; onChange: (opts: string[]) => void; fieldType: string }) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2 group">
          {/* Icon indicator */}
          <span className="w-5 text-center text-gray-300 flex-shrink-0">
            {fieldType === 'checkbox' ? '☐' : fieldType === 'ranking' ? `${i + 1}.` : '○'}
          </span>
          {/* Editable option text */}
          <input
            value={opt}
            onChange={(e) => {
              const newOpts = [...options]
              newOpts[i] = e.target.value
              onChange(newOpts)
            }}
            className="flex-1 text-sm border-0 border-b border-gray-100 focus:border-indigo-300 outline-none py-1.5 bg-transparent"
          />
          {/* Remove button */}
          {options.length > 1 && (
            <button
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange([...options, `选项 ${options.length + 1}`])}
        className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 py-1 ml-7"
      >
        + 添加选项
      </button>
    </div>
  )
}

// ===== Guide Section =====
function GuideSection({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  const hasGuide = !!(field.guideImage || field.guideText)
  const [show, setShow] = useState(hasGuide)

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-xs text-gray-400 hover:text-indigo-500">
        + 添加图文引导
      </button>
    )
  }

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-600">图文引导</span>
        <button
          onClick={() => { update({ guideImage: undefined, guideText: undefined }); setShow(false) }}
          className="text-xs text-gray-400 hover:text-red-400"
        >
          移除
        </button>
      </div>
      <Input
        value={field.guideImage || ''}
        onChange={(e) => update({ guideImage: e.target.value || undefined })}
        placeholder="引导图片 URL"
        className="h-8 text-xs"
      />
      <Textarea
        value={field.guideText || ''}
        onChange={(e) => update({ guideText: e.target.value || undefined })}
        placeholder="引导说明文字"
        rows={2}
        className="text-xs"
      />
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

  return (
    <div className="relative flex justify-center">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-3 z-50 bg-white rounded-xl shadow-xl border p-3 w-64">
            <p className="text-xs text-gray-400 mb-2 px-1">选择题目类型</p>
            <div className="grid grid-cols-2 gap-1">
              {FIELD_TYPES.map(ft => (
                <button
                  key={ft.type}
                  onClick={() => addField(ft.type)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                >
                  <span className="text-base">{ft.icon}</span>
                  <span>{ft.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ===== Main FieldCanvas =====
export function FieldCanvas() {
  const { state, dispatch } = useEditor()

  // Require 10px of movement before dragging starts - prevents accidental drags when clicking
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = state.fields.findIndex((f) => f.id === active.id)
      const newIndex = state.fields.findIndex((f) => f.id === over.id)
      dispatch({ type: 'REORDER_FIELDS', payload: arrayMove(state.fields, oldIndex, newIndex) })
    }
  }

  // Click on empty area deselects
  const handleBackgroundClick = () => {
    dispatch({ type: 'SELECT_FIELD', payload: null })
  }

  return (
    <div className="h-full overflow-y-auto" onClick={handleBackgroundClick}>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Title Card */}
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-2.5 bg-indigo-500" />
          <div className="p-5">
            <input
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
              className="w-full text-xl font-bold text-gray-800 border-0 border-b-2 border-transparent focus:border-indigo-400 outline-none pb-1 bg-transparent"
              placeholder="问卷标题"
            />
            <input
              value={state.description}
              onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
              className="w-full text-sm text-gray-500 border-0 border-b border-transparent focus:border-gray-300 outline-none py-1.5 mt-2 bg-transparent placeholder-gray-300"
              placeholder="问卷描述"
            />
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
                {state.fields.map((field) => (
                  <SortableFieldCard key={field.id} field={field} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add button */}
        <div className="mt-6" onClick={(e) => e.stopPropagation()}>
          <AddFieldButton />
        </div>
      </div>
    </div>
  )
}
