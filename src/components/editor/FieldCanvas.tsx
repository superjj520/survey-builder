'use client'

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
import { SurveyField, FIELD_TYPE_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'

function SortableField({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isSelected = state.selectedFieldId === field.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-indigo-500 border-indigo-300' : 'hover:border-gray-300'
      }`}
      onClick={() => dispatch({ type: 'SELECT_FIELD', payload: field.id })}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          ⠿
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{field.label}</span>
            {field.required && <span className="text-red-500 text-xs">*</span>}
          </div>
          <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'REMOVE_FIELD', payload: field.id })
          }}
          className="text-gray-400 hover:text-red-500"
        >
          ✕
        </Button>
      </div>
    </div>
  )
}

export function FieldCanvas() {
  const { state, dispatch } = useEditor()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = state.fields.findIndex((f) => f.id === active.id)
      const newIndex = state.fields.findIndex((f) => f.id === over.id)
      dispatch({ type: 'REORDER_FIELDS', payload: arrayMove(state.fields, oldIndex, newIndex) })
    }
  }

  if (state.fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">从左侧添加字段</p>
          <p className="text-sm">点击或拖拽字段类型到此处</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={state.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {state.fields.map((field) => (
            <SortableField key={field.id} field={field} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
