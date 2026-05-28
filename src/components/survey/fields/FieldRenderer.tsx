'use client'

import { useState, useRef, useEffect } from 'react'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FieldRendererProps {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  theme: ThemeSettings
}

export function FieldRenderer({ field, value, onChange, theme }: FieldRendererProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      {/* Left accent bar via border */}
      <div className="border-l-4 p-6" style={{ borderLeftColor: theme.primaryColor }}>
        {/* Label + required */}
        <div className="mb-1">
          <h3 className="text-base font-medium text-gray-800 leading-relaxed">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>

        {/* Description */}
        {field.description && (
          <p className="text-sm text-gray-500 mb-4">{field.description}</p>
        )}

        {/* Guide section */}
        {(field.guideImage || field.guideText) && (
          <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-100">
            {field.guideImage && (
              <img
                src={field.guideImage}
                alt="引导图片"
                className="w-full max-h-48 object-contain rounded-md mb-3"
              />
            )}
            {field.guideText && (
              <p className="text-sm text-blue-700 leading-relaxed">{field.guideText}</p>
            )}
          </div>
        )}

        {/* Field input */}
        <div className="mt-3">
          {renderFieldInput(field, value, onChange, theme)}
        </div>
      </div>
    </div>
  )
}

function renderFieldInput(field: SurveyField, value: unknown, onChange: (v: unknown) => void, theme: ThemeSettings) {
  switch (field.type) {
    case 'text':
      if (field.multiline) {
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '请输入您的回答'}
            maxLength={field.maxLength}
            rows={4}
            className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent resize-none text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors"
          />
        )
      }
      return (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '请输入您的回答'}
          maxLength={field.maxLength}
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors"
        />
      )

    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                value === opt
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  value === opt ? 'border-purple-500' : 'border-gray-300'
                }`}
              >
                {value === opt && (
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                )}
              </span>
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox':
      const checkedValues = (value as string[]) || []
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => {
            const isChecked = checkedValues.includes(opt)
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    isChecked ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            )
          })}
        </div>
      )

    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger className="border-0 border-b-2 border-gray-200 rounded-none focus:ring-0 h-11 text-base px-0">
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
        <div className="flex gap-3 py-2">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              className="text-4xl transition-all hover:scale-125 active:scale-95"
              style={{ color: star <= currentRating ? theme.primaryColor : '#e5e7eb' }}
            >
              ★
            </button>
          ))}
          {currentRating > 0 && (
            <span className="self-center text-sm text-gray-400 ml-2">{currentRating}/{maxRating}</span>
          )}
        </div>
      )

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent text-base py-2 px-0 outline-none transition-colors"
        />
      )

    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-purple-300 transition-colors">
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
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">点击上传文件</p>
            {field.acceptedTypes && (
              <p className="text-xs text-gray-400 mt-1">支持格式：{field.acceptedTypes}</p>
            )}
          </label>
          {value ? <p className="text-sm mt-3 text-green-600 font-medium">已选择：{String(value)}</p> : null}
        </div>
      )

    case 'matrix':
      const matrixValues = (value as Record<string, string>) || {}
      return (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left"></th>
                {(field.columns || []).map((col) => (
                  <th key={col} className="p-3 text-center font-normal text-gray-500 text-xs">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(field.rows || []).map((row, idx) => (
                <tr key={row} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-3 font-medium text-gray-700">{row}</td>
                  {(field.columns || []).map((col) => (
                    <td key={col} className="p-3 text-center">
                      <input
                        type="radio"
                        name={`${field.id}-${row}`}
                        checked={matrixValues[row] === col}
                        onChange={() => onChange({ ...matrixValues, [row]: col })}
                        className="w-4 h-4 cursor-pointer"
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
          <p className="text-xs text-gray-400 mb-3">点击箭头调整顺序（上方为最高优先级）</p>
          {items.map((item, index) => (
            <div key={item} className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700">{item}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => {
                    const newItems = [...items]
                    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
                    onChange(newItems)
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                </button>
                <button
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                  disabled={index === items.length - 1}
                  onClick={() => {
                    const newItems = [...items]
                    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
                    onChange(newItems)
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )

    case 'signature':
      return <SignatureField fieldId={field.id} value={value} onChange={onChange} theme={theme} />

    case 'voice':
      return <VoiceField field={field} value={value} onChange={onChange} theme={theme} />

    case 'nps':
      const npsValue = (value as number) ?? -1
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <button
                key={i}
                onClick={() => onChange(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  npsValue === i
                    ? 'text-white shadow-md scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={npsValue === i ? { backgroundColor: theme.primaryColor } : {}}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>{field.npsLeftLabel || '非常不推荐'}</span>
            <span>{field.npsRightLabel || '非常推荐'}</span>
          </div>
        </div>
      )

    case 'slider':
      const sliderMin = field.sliderMin ?? 0
      const sliderMax = field.sliderMax ?? 100
      const sliderStep = field.sliderStep ?? 1
      const sliderVal = (value as number) ?? sliderMin
      return (
        <div className="space-y-3">
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={sliderVal}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: theme.primaryColor }}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{sliderMin}</span>
            <span className="text-base font-medium text-gray-700">{sliderVal}</span>
            <span>{sliderMax}</span>
          </div>
        </div>
      )

    case 'phone':
      return (
        <input
          type="tel"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '请输入手机号'}
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors"
        />
      )

    case 'email':
      return (
        <input
          type="email"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '请输入邮箱'}
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors"
        />
      )

    case 'address':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '请输入详细地址'}
          rows={2}
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent resize-none text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors"
        />
      )

    case 'image_choice':
      const imageOpts = field.imageOptions || []
      const isMulti = field.multiSelect
      const imgSelected = isMulti ? ((value as string[]) || []) : [value as string]
      return (
        <div className="grid grid-cols-2 gap-3">
          {imageOpts.map((opt) => {
            const isChosen = imgSelected.includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isMulti) {
                    const arr = (value as string[]) || []
                    onChange(isChosen ? arr.filter(x => x !== opt.id) : [...arr, opt.id])
                  } else {
                    onChange(opt.id)
                  }
                }}
                className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                  isChosen ? 'border-purple-400 shadow-md' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {opt.imageUrl ? (
                  <img src={opt.imageUrl} alt={opt.label} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="p-2 flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isChosen ? 'border-purple-500' : 'border-gray-300'}`}>
                    {isChosen && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{opt.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )

    default:
      return <p className="text-gray-400">不支持的字段类型</p>
  }
}

// Signature component
function SignatureField({ fieldId, value, onChange, theme }: { fieldId: string; value: unknown; onChange: (v: unknown) => void; theme: ThemeSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL())
    }
  }

  return (
    <div className="border-2 border-gray-100 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-36 cursor-crosshair bg-gray-50"
        style={{ touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex justify-between items-center px-4 py-2 bg-white border-t border-gray-100">
        <span className="text-xs text-gray-400">在上方区域签名</span>
        <button
          className="text-xs px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: theme.primaryColor }}
          onClick={() => {
            const canvas = canvasRef.current
            const ctx = canvas?.getContext('2d')
            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              onChange(null)
            }
          }}
        >
          清除
        </button>
      </div>
    </div>
  )
}

// Voice recorder component
function VoiceField({ field, value, onChange, theme }: { field: SurveyField; value: unknown; onChange: (v: unknown) => void; theme: ThemeSettings }) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxDuration = field.maxDuration || 60

  useEffect(() => {
    // Restore audio URL from stored value
    if (value && typeof value === 'string' && value.startsWith('data:')) {
      setAudioUrl(value)
    }
  }, [value])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setAudioUrl(base64)
          onChange(base64)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d + 1 >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return d + 1
        })
      }, 1000)
    } catch {
      alert('无法访问麦克风，请检查浏览器权限')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const deleteRecording = () => {
    setAudioUrl(null)
    setDuration(0)
    onChange(null)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="rounded-xl border-2 border-gray-100 p-5">
      {!audioUrl ? (
        <div className="flex flex-col items-center gap-4">
          {recording ? (
            <>
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#fee2e2' }}>
                  <div className="w-6 h-6 rounded bg-red-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-medium text-gray-700">{formatTime(duration)}</p>
                <p className="text-xs text-gray-400 mt-1">最长 {maxDuration} 秒</p>
              </div>
              <button
                onClick={stopRecording}
                className="px-6 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#ef4444' }}
              >
                停止录音
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
              <p className="text-sm text-gray-400">点击开始录音</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '20' }}>
              <svg className="w-5 h-5" fill={theme.primaryColor} viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">录音完成</p>
              <p className="text-xs text-gray-400">{formatTime(duration)}</p>
            </div>
            <button
              onClick={deleteRecording}
              className="text-xs text-red-400 hover:text-red-600 px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
            >
              删除
            </button>
          </div>
          <audio src={audioUrl} controls className="w-full h-8" />
        </div>
      )}
    </div>
  )
}
