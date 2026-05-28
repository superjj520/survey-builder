'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor } from './EditorContext'
import { SurveyField, FieldType, FIELD_TYPE_LABELS, LogicOperator } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { nanoid } from 'nanoid'

const FIELD_TYPE_OPTIONS: { type: FieldType; icon: string; label: string }[] = [
  { type: 'text', icon: 'Aa', label: '文本' },
  { type: 'radio', icon: '◉', label: '单选' },
  { type: 'checkbox', icon: '☑', label: '多选' },
  { type: 'select', icon: '▼', label: '下拉' },
  { type: 'rating', icon: '★', label: '评分' },
  { type: 'file', icon: '📎', label: '文件' },
  { type: 'date', icon: '📅', label: '日期' },
  { type: 'matrix', icon: '▦', label: '矩阵' },
  { type: 'ranking', icon: '↕', label: '排序' },
  { type: 'signature', icon: '✍', label: '签名' },
  { type: 'voice', icon: '🎙', label: '语音' },
]

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

function SortableField({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isSelected = state.selectedFieldId === field.id

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-md border border-gray-100'
      }`}
      onClick={() => dispatch({ type: 'SELECT_FIELD', payload: field.id })}
    >
      {/* Collapsed view */}
      {!isSelected ? (
        <div className="p-4 flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">{field.label}</span>
              {field.required && <span className="text-red-400 text-xs">必填</span>}
            </div>
            <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</span>
          </div>
        </div>
      ) : (
        /* Expanded inline editor */
        <div className="border-l-4 border-indigo-500" onClick={(e) => e.stopPropagation()}>
          {/* Drag handle & actions bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatch({ type: 'DUPLICATE_FIELD', payload: field.id })}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="复制"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => dispatch({ type: 'REMOVE_FIELD', payload: field.id })}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Title + Type selector row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  value={field.label}
                  onChange={(e) => update({ label: e.target.value })}
                  className="w-full text-base font-medium text-gray-800 border-0 border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-2 bg-transparent transition-colors"
                  placeholder="输入题目标题"
                />
              </div>
              <Select
                value={field.type}
                onValueChange={(val) => update({ type: val as FieldType })}
              >
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.type} value={opt.type}>
                      <span className="mr-1">{opt.icon}</span> {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <input
              value={field.description || ''}
              onChange={(e) => update({ description: e.target.value || undefined })}
              className="w-full text-sm text-gray-500 border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1 bg-transparent placeholder-gray-300 transition-colors"
              placeholder="添加说明文字（可选）"
            />

            {/* Type-specific inline config */}
            <InlineFieldConfig field={field} update={update} />

            {/* Guide section */}
            <GuideConfig field={field} update={update} />

            {/* Bottom actions: required toggle + logic */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => update({ required: checked })}
                  />
                  必填
                </label>
              </div>
              <InlineLogicConfig field={field} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InlineFieldConfig({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  switch (field.type) {
    case 'text':
      return (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <Switch checked={field.multiline || false} onCheckedChange={(checked) => update({ multiline: checked })} />
            多行文本
          </label>
          <input
            value={field.placeholder || ''}
            onChange={(e) => update({ placeholder: e.target.value })}
            className="flex-1 text-sm text-gray-400 border-0 border-b border-dashed border-gray-200 outline-none py-1 bg-transparent placeholder-gray-300"
            placeholder="占位文字"
          />
        </div>
      )
    case 'radio':
    case 'checkbox':
    case 'select':
    case 'ranking':
      return <InlineOptionsEditor options={field.options || []} onChange={(options) => update({ options })} type={field.type} />
    case 'rating':
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">最高分:</span>
          <input
            type="number"
            min={3}
            max={10}
            value={field.maxRating || 5}
            onChange={(e) => update({ maxRating: parseInt(e.target.value) })}
            className="w-16 text-sm border rounded-md px-2 py-1 text-center"
          />
          <div className="flex gap-0.5 ml-2">
            {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
              <span key={i} className="text-lg text-indigo-300">★</span>
            ))}
          </div>
        </div>
      )
    case 'matrix':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">行标题</p>
            <InlineOptionsEditor options={field.rows || []} onChange={(rows) => update({ rows })} type="radio" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">列标题</p>
            <InlineOptionsEditor options={field.columns || []} onChange={(columns) => update({ columns })} type="radio" />
          </div>
        </div>
      )
    case 'file':
      return (
        <input
          value={field.acceptedTypes || ''}
          onChange={(e) => update({ acceptedTypes: e.target.value })}
          className="text-sm text-gray-500 border-0 border-b border-dashed border-gray-200 outline-none py-1 bg-transparent placeholder-gray-300 w-full"
          placeholder="允许的文件类型，如: .pdf,.jpg,.png"
        />
      )
    case 'voice':
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">最长录音:</span>
          <input
            type="number"
            min={10}
            max={300}
            value={field.maxDuration || 60}
            onChange={(e) => update({ maxDuration: parseInt(e.target.value) })}
            className="w-16 text-sm border rounded-md px-2 py-1 text-center"
          />
          <span className="text-sm text-gray-400">秒</span>
        </div>
      )
    default:
      return null
  }
}

function InlineOptionsEditor({ options, onChange, type }: { options: string[]; onChange: (opts: string[]) => void; type: string }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-gray-300 w-5 text-center flex-shrink-0">
            {type === 'checkbox' ? (
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={2}/></svg>
            ) : type === 'ranking' ? (
              <span className="text-xs">{i + 1}.</span>
            ) : (
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/></svg>
            )}
          </span>
          <input
            value={opt}
            onChange={(e) => {
              const newOpts = [...options]
              newOpts[i] = e.target.value
              onChange(newOpts)
            }}
            className="flex-1 text-sm border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1.5 bg-transparent transition-colors"
          />
          <button
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...options, `选项 ${options.length + 1}`])}
        className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 py-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加选项
      </button>
    </div>
  )
}

function GuideConfig({ field, update }: { field: SurveyField; update: (u: Partial<SurveyField>) => void }) {
  const [expanded, setExpanded] = useState(!!(field.guideImage || field.guideText))

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加图文引导
      </button>
    )
  }

  return (
    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-600">图文引导</span>
        <button
          onClick={() => { update({ guideImage: undefined, guideText: undefined }); setExpanded(false) }}
          className="text-xs text-gray-400 hover:text-red-400"
        >
          移除
        </button>
      </div>
      <Input
        value={field.guideImage || ''}
        onChange={(e) => update({ guideImage: e.target.value || undefined })}
        placeholder="引导图片 URL"
        className="text-xs h-8"
      />
      <Textarea
        value={field.guideText || ''}
        onChange={(e) => update({ guideText: e.target.value || undefined })}
        placeholder="引导说明文字"
        rows={2}
        className="text-xs min-h-0"
      />
    </div>
  )
}

function InlineLogicConfig({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const [showLogic, setShowLogic] = useState(!!field.logic?.show_if)
  const otherFields = state.fields.filter((f) => f.id !== field.id)

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  if (otherFields.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (!showLogic) {
            update({ logic: { show_if: { field: otherFields[0].id, operator: 'equals', value: '' } } })
            setShowLogic(true)
          } else {
            update({ logic: undefined })
            setShowLogic(false)
          }
        }}
        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
          showLogic ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        {showLogic ? '条件显示 ✓' : '+ 条件逻辑'}
      </button>
    </div>
  )
}

// Add field floating menu
function AddFieldMenu({ onAdd }: { onAdd: (type: FieldType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-xl shadow-xl border p-3 w-56">
            <p className="text-xs text-gray-400 mb-2 px-1">添加题目</p>
            <div className="grid grid-cols-2 gap-1">
              {FIELD_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { onAdd(opt.type); setOpen(false) }}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                >
                  <span className="text-base w-5 text-center">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function FieldCanvas() {
  const { state, dispatch } = useEditor()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = state.fields.findIndex((f) => f.id === active.id)
      const newIndex = state.fields.findIndex((f) => f.id === over.id)
      dispatch({ type: 'REORDER_FIELDS', payload: arrayMove(state.fields, oldIndex, newIndex) })
    }
  }

  const addField = (type: FieldType) => {
    dispatch({ type: 'ADD_FIELD', payload: createField(type) })
  }

  if (state.fields.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-500 mb-2">开始创建问卷</p>
        <p className="text-sm text-gray-400 mb-6">点击下方按钮添加第一个题目</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {FIELD_TYPE_OPTIONS.slice(0, 5).map(opt => (
            <button
              key={opt.type}
              onClick={() => addField(opt.type)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" onClick={() => dispatch({ type: 'SELECT_FIELD', payload: null })}>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Title card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border-t-4 border-indigo-500">
          <div className="p-5">
            <input
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
              className="w-full text-2xl font-bold text-gray-800 border-0 border-b-2 border-transparent focus:border-indigo-500 outline-none pb-1 bg-transparent transition-colors"
              placeholder="未命名问卷"
              onClick={(e) => e.stopPropagation()}
            />
            <input
              value={state.description}
              onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
              className="w-full text-sm text-gray-500 border-0 border-b border-transparent focus:border-gray-300 outline-none py-2 bg-transparent mt-2 placeholder-gray-300 transition-colors"
              placeholder="问卷描述（可选）"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Field list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={state.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {state.fields.map((field) => (
                <SortableField key={field.id} field={field} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Floating add button */}
        <div className="flex justify-center mt-6">
          <AddFieldMenu onAdd={addField} />
        </div>
      </div>
    </div>
  )
}
