'use client'

import { SurveyField, ThemeSettings } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FieldRendererProps {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  theme: ThemeSettings
}

export function FieldRenderer({ field, value, onChange, theme }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-gray-500">{field.description}</p>
      )}
      {renderFieldInput(field, value, onChange, theme)}
    </div>
  )
}

function renderFieldInput(field: SurveyField, value: unknown, onChange: (v: unknown) => void, theme: ThemeSettings) {
  switch (field.type) {
    case 'text':
      if (field.multiline) {
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '请输入...'}
            maxLength={field.maxLength}
          />
        )
      }
      return (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '请输入...'}
          maxLength={field.maxLength}
        />
      )

    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                style={{ accentColor: theme.primaryColor }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox':
      const checkedValues = (value as string[]) || []
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={checkedValues.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...checkedValues, opt])
                  } else {
                    onChange(checkedValues.filter((v) => v !== opt))
                  }
                }}
                style={{ accentColor: theme.primaryColor }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="请选择..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'rating':
      const maxRating = field.maxRating || 5
      const currentRating = (value as number) || 0
      return (
        <div className="flex gap-2">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              className="text-3xl transition-transform hover:scale-110"
              style={{ color: star <= currentRating ? theme.primaryColor : '#e5e7eb' }}
            >
              ★
            </button>
          ))}
        </div>
      )

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'file':
      return (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept={field.acceptedTypes}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange(file.name)
            }}
            className="hidden"
            id={`file-${field.id}`}
          />
          <label htmlFor={`file-${field.id}`} className="cursor-pointer">
            <p className="text-gray-500">点击上传文件</p>
            {field.acceptedTypes && (
              <p className="text-xs text-gray-400 mt-1">支持格式：{field.acceptedTypes}</p>
            )}
          </label>
          {value ? <p className="text-sm mt-2 text-green-600">已选择：{String(value)}</p> : null}
        </div>
      )

    case 'matrix':
      const matrixValues = (value as Record<string, string>) || {}
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2"></th>
                {(field.columns || []).map((col) => (
                  <th key={col} className="p-2 text-center font-normal text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(field.rows || []).map((row) => (
                <tr key={row} className="border-t">
                  <td className="p-2 font-medium">{row}</td>
                  {(field.columns || []).map((col) => (
                    <td key={col} className="p-2 text-center">
                      <input
                        type="radio"
                        name={`${field.id}-${row}`}
                        checked={matrixValues[row] === col}
                        onChange={() => onChange({ ...matrixValues, [row]: col })}
                        style={{ accentColor: theme.primaryColor }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'ranking':
      const items = (value as string[]) || field.options || []
      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">拖拽排列顺序（上方为最高优先级）</p>
          {items.map((item, index) => (
            <div key={item} className="flex items-center gap-3 p-3 rounded-md border bg-white">
              <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
              <span className="flex-1">{item}</span>
              <div className="flex flex-col gap-1">
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    if (index === 0) return
                    const newItems = [...items]
                    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
                    onChange(newItems)
                  }}
                >
                  ▲
                </button>
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    if (index === items.length - 1) return
                    const newItems = [...items]
                    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
                    onChange(newItems)
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )

    case 'signature':
      return (
        <div className="border rounded-lg p-4">
          <canvas
            id={`sig-${field.id}`}
            className="w-full h-32 border rounded cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
          <div className="flex justify-end mt-2">
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => {
                const canvas = document.getElementById(`sig-${field.id}`) as HTMLCanvasElement
                const ctx = canvas?.getContext('2d')
                ctx?.clearRect(0, 0, canvas.width, canvas.height)
                onChange(null)
              }}
            >
              清除
            </button>
          </div>
        </div>
      )

    default:
      return <p className="text-gray-400">不支持的字段类型</p>
  }
}
