'use client'

import { useEditor } from './EditorContext'
import { SurveyField, FieldType, FIELD_TYPE_LABELS, LogicOperator } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FieldConfig() {
  const { state, dispatch } = useEditor()
  const field = state.fields.find((f) => f.id === state.selectedFieldId)

  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        选择一个字段进行配置
      </div>
    )
  }

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-gray-500">字段配置</h3>

      {/* Label */}
      <div className="space-y-2">
        <Label>标题</Label>
        <Input value={field.label} onChange={(e) => update({ label: e.target.value })} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>说明文字</Label>
        <Input
          value={field.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="可选"
        />
      </div>

      {/* Required */}
      <div className="flex items-center justify-between">
        <Label>必填</Label>
        <Switch checked={field.required} onCheckedChange={(checked) => update({ required: checked })} />
      </div>

      {/* Type-specific config */}
      {renderTypeConfig(field, update)}

      {/* Conditional Logic */}
      <ConditionalLogicConfig field={field} />
    </div>
  )
}

function renderTypeConfig(field: SurveyField, update: (u: Partial<SurveyField>) => void) {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>多行文本</Label>
            <Switch
              checked={field.multiline || false}
              onCheckedChange={(checked) => update({ multiline: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>占位文字</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => update({ placeholder: e.target.value })}
              placeholder="请输入..."
            />
          </div>
        </div>
      )
    case 'radio':
    case 'checkbox':
    case 'select':
    case 'ranking':
      return <OptionsEditor options={field.options || []} onChange={(options) => update({ options })} />
    case 'rating':
      return (
        <div className="space-y-2">
          <Label>最高分</Label>
          <Input
            type="number"
            min={3}
            max={10}
            value={field.maxRating || 5}
            onChange={(e) => update({ maxRating: parseInt(e.target.value) })}
          />
        </div>
      )
    case 'matrix':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>行标题</Label>
            <OptionsEditor
              options={field.rows || []}
              onChange={(rows) => update({ rows })}
            />
          </div>
          <div className="space-y-2">
            <Label>列标题</Label>
            <OptionsEditor
              options={field.columns || []}
              onChange={(columns) => update({ columns })}
            />
          </div>
        </div>
      )
    case 'file':
      return (
        <div className="space-y-2">
          <Label>允许的文件类型</Label>
          <Input
            value={field.acceptedTypes || ''}
            onChange={(e) => update({ acceptedTypes: e.target.value })}
            placeholder="例如: .pdf,.jpg,.png"
          />
        </div>
      )
    default:
      return null
  }
}

function OptionsEditor({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label>选项</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={opt}
            onChange={(e) => {
              const newOpts = [...options]
              newOpts[i] = e.target.value
              onChange(newOpts)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            className="text-gray-400 hover:text-red-500 shrink-0"
          >
            ✕
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...options, `选项 ${options.length + 1}`])}
        className="w-full"
      >
        + 添加选项
      </Button>
    </div>
  )
}

function ConditionalLogicConfig({ field }: { field: SurveyField }) {
  const { state, dispatch } = useEditor()
  const otherFields = state.fields.filter((f) => f.id !== field.id)
  const hasLogic = !!field.logic?.show_if

  const update = (updates: Partial<SurveyField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
  }

  if (otherFields.length === 0) return null

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-500">条件显示</Label>
        <Switch
          checked={hasLogic}
          onCheckedChange={(checked) => {
            if (checked) {
              update({
                logic: {
                  show_if: {
                    field: otherFields[0].id,
                    operator: 'equals',
                    value: '',
                  },
                },
              })
            } else {
              update({ logic: undefined })
            }
          }}
        />
      </div>

      {hasLogic && field.logic?.show_if && (
        <div className="space-y-2 text-sm">
          <Select
            value={field.logic.show_if.field}
            onValueChange={(val) =>
              update({ logic: { show_if: { ...field.logic!.show_if, field: val as string } } })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {otherFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={field.logic.show_if.operator}
            onValueChange={(val) =>
              update({ logic: { show_if: { ...field.logic!.show_if, operator: val as LogicOperator } } })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">等于</SelectItem>
              <SelectItem value="not_equals">不等于</SelectItem>
              <SelectItem value="contains">包含</SelectItem>
              <SelectItem value="is_empty">为空</SelectItem>
              <SelectItem value="is_not_empty">不为空</SelectItem>
            </SelectContent>
          </Select>

          {!['is_empty', 'is_not_empty'].includes(field.logic.show_if.operator) && (
            <Input
              value={(field.logic.show_if.value as string) || ''}
              onChange={(e) =>
                update({ logic: { show_if: { ...field.logic!.show_if, value: e.target.value } } })
              }
              placeholder="值"
            />
          )}
        </div>
      )}
    </div>
  )
}
