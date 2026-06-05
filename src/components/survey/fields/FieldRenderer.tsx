'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, Image, Star, Heart, ThumbsUp, CheckCircle } from 'lucide-react'
import { SurveyField, ThemeSettings } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Mic, ChevronUp, ChevronDown } from 'lucide-react'

interface FieldRendererProps {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  theme: ThemeSettings
  questionNumber?: string | number
}

export function FieldRenderer({ field, value, onChange, theme, questionNumber }: FieldRendererProps) {
  // Section type renders differently — no input, just a visual header
  if (field.type === 'section') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="h-2 w-full" style={{ backgroundColor: theme.primaryColor }} />
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">{field.label}</h2>
          {field.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{field.description}</p>
          )}
          {(field.guideImage || field.guideText) && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
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
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <div className="p-6">
        {/* Label + required */}
        <div className="mb-1">
          <h3 className="text-[15px] font-bold text-slate-800 leading-relaxed">
            {questionNumber && (
              <span className="inline-flex items-center gap-1 text-xs font-bold mr-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${theme.primaryColor}10`, color: theme.primaryColor }}>
                Q{questionNumber}
              </span>
            )}
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>

        {/* Description */}
        {field.description && (
          <p className="text-sm text-slate-400 mb-4">{field.description}</p>
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
            className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent resize-none text-base py-2 px-0 placeholder-gray-300 outline-none transition-all focus:scale-[1.01] focus:translate-y-[-1px]"
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
          className="w-full border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-all focus:scale-[1.01] focus:translate-y-[-1px]"
        />
      )

    case 'radio':
      return (
        <div className="space-y-2.5">
          {(field.options || []).map((opt) => (
            <div
              key={opt}
              onClick={() => onChange(opt)}
              className={`flex items-center gap-3.5 p-4 rounded-2xl border-[1.5px] cursor-pointer transition-all duration-200 active:scale-[0.97] ${
                value === opt
                  ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:-translate-y-[1px] hover:shadow-sm'
              }`}
              style={value === opt ? { boxShadow: `0 4px 12px ${theme.primaryColor}15` } : undefined}
            >
              <span
                className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  value === opt ? 'border-transparent' : 'border-slate-300'
                }`}
                style={value === opt ? { backgroundColor: theme.primaryColor } : undefined}
              >
                {value === opt && (
                  <Check className="w-3 h-3 text-white animate-scaleIn" strokeWidth={3} />
                )}
              </span>
              <span className={`text-[15px] transition-colors ${value === opt ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>{opt}</span>
            </div>
          ))}
        </div>
      )

    case 'checkbox':
      const checkedValues = (value as string[]) || []
      return (
        <div className="space-y-2.5">
          {(field.options || []).map((opt) => {
            const isChecked = checkedValues.includes(opt)
            return (
              <div
                key={opt}
                onClick={() => {
                  if (isChecked) {
                    onChange(checkedValues.filter(v => v !== opt))
                  } else {
                    onChange([...checkedValues, opt])
                  }
                }}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border-[1.5px] cursor-pointer transition-all duration-200 active:scale-[0.97] ${
                  isChecked
                    ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:-translate-y-[1px] hover:shadow-sm'
                }`}
                style={isChecked ? { boxShadow: `0 4px 12px ${theme.primaryColor}15` } : undefined}
              >
                <span
                  className={`w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    isChecked ? 'border-transparent' : 'border-slate-300'
                  }`}
                  style={isChecked ? { backgroundColor: theme.primaryColor } : undefined}
                >
                  {isChecked && (
                    <Check className="w-3 h-3 text-white animate-scaleIn" strokeWidth={3} />
                  )}
                </span>
                <span className={`text-[15px] transition-colors ${isChecked ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>{opt}</span>
              </div>
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
      const currentRating = typeof value === 'number' && value > 0 ? value : 0
      const iconType = field.ratingIcon || 'star'
      return (
        <div className="flex gap-1.5 sm:gap-2 py-2 flex-wrap group">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              className="w-8 h-8 sm:w-10 sm:h-10 transition-all hover:scale-125 active:scale-90 peer"
              data-star={star}
              onMouseEnter={(e) => {
                const parent = e.currentTarget.parentElement
                if (!parent) return
                parent.querySelectorAll('button').forEach(btn => {
                  const s = Number(btn.getAttribute('data-star'))
                  if (s <= star) btn.style.opacity = '1'
                  else btn.style.opacity = '0.4'
                })
              }}
              onMouseLeave={(e) => {
                const parent = e.currentTarget.parentElement
                if (!parent) return
                parent.querySelectorAll('button').forEach(btn => { btn.style.opacity = '1' })
              }}
            >
              <RatingIcon type={iconType} filled={star <= currentRating} color={theme.primaryColor} />
            </button>
          ))}
          {currentRating > 0 && (
            <span className="self-center text-sm text-gray-400 ml-2 animate-fadeIn">{currentRating}/{maxRating}</span>
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
              <Upload className="w-6 h-6 text-gray-400" />
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
                  <ChevronUp className="w-3.5 h-3.5" />
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
                  <ChevronDown className="w-3.5 h-3.5" />
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
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <button
                key={i}
                onClick={() => onChange(i)}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${
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
      const sliderHasValue = value !== undefined && value !== null
      const sliderVal = sliderHasValue ? (value as number) : Math.round((sliderMin + sliderMax) / 2)
      return (
        <div className="space-y-3">
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={sliderVal}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className={`w-full h-2 rounded-full appearance-none cursor-pointer ${!sliderHasValue ? 'opacity-40' : ''}`}
            style={{ accentColor: theme.primaryColor }}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{sliderMin}</span>
            <span className={`text-base font-medium ${sliderHasValue ? 'text-gray-700' : 'text-gray-300'}`}>
              {sliderHasValue ? sliderVal : '拖动选择'}
            </span>
            <span>{sliderMax}</span>
          </div>
        </div>
      )

    case 'phone':
      return (
        <PhoneInput value={(value as string) || ''} onChange={onChange} placeholder={field.placeholder || '请输入手机号'} />
      )

    case 'email':
      return (
        <EmailInput value={(value as string) || ''} onChange={onChange} placeholder={field.placeholder || '请输入邮箱'} />
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
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
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
                    <Image className="w-8 h-8" strokeWidth={1.5} />
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
      toast.error('无法访问麦克风，请检查浏览器权限')
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
                <Mic className="w-7 h-7 text-white" />
              </button>
              <p className="text-sm text-gray-400">点击开始录音</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '20' }}>
              <Mic className="w-5 h-5" style={{ color: theme.primaryColor }} />
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

// Phone input with validation
function PhoneInput({ value, onChange, placeholder }: { value: string; onChange: (v: unknown) => void; placeholder: string }) {
  const [touched, setTouched] = useState(false)
  const isValid = !value || /^1[3-9]\d{9}$/.test(value)

  return (
    <div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`w-full border-0 border-b-2 ${touched && !isValid ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'} focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors`}
      />
      {touched && !isValid && value && (
        <p className="text-xs text-red-500 mt-1">请输入正确的手机号</p>
      )}
    </div>
  )
}

// Email input with validation
function EmailInput({ value, onChange, placeholder }: { value: string; onChange: (v: unknown) => void; placeholder: string }) {
  const [touched, setTouched] = useState(false)
  const isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  return (
    <div>
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`w-full border-0 border-b-2 ${touched && !isValid ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'} focus:ring-0 bg-transparent text-base py-2 px-0 placeholder-gray-300 outline-none transition-colors`}
      />
      {touched && !isValid && value && (
        <p className="text-xs text-red-500 mt-1">请输入正确的邮箱地址</p>
      )}
    </div>
  )
}

// Rating icon component using Lucide icons where possible
function RatingIcon({ type, filled, color }: { type: string; filled: boolean; color: string }) {
  const iconProps = {
    className: 'w-full h-full',
    strokeWidth: 1.5,
    fill: filled ? color : 'none',
    color: filled ? color : '#d1d5db',
  }

  switch (type) {
    case 'star':
      return <Star {...iconProps} />
    case 'heart':
      return <Heart {...iconProps} />
    case 'thumb':
      return <ThumbsUp {...iconProps} />
    case 'check':
      return <CheckCircle {...iconProps} />
    case 'dog':
      return filled ? (
        <svg viewBox="0 0 1024 1024" fill={color} className="w-full h-full">
          <path d="M827.2 356.8c-3.2-22.4-9.6-44.8-19.2-64-9.6-25.6-22.4-48-38.4-67.2-6.4-6.4-12.8-16-22.4-22.4l-3.2-3.2c-6.4 19.2-16 35.2-28.8 51.2-16 16-35.2 28.8-57.6 35.2-22.4 6.4-44.8 6.4-67.2 0-22.4-6.4-41.6-19.2-57.6-35.2-16-16-28.8-35.2-35.2-57.6-6.4-22.4-6.4-44.8 0-67.2 6.4-22.4 19.2-41.6 35.2-57.6 9.6-9.6 22.4-19.2 35.2-25.6-32-6.4-64-6.4-96 0-28.8 6.4-57.6 16-83.2 32-25.6 16-48 35.2-67.2 57.6-12.8 16-22.4 32-32 51.2-6.4 12.8-9.6 25.6-16 38.4-3.2 12.8-6.4 25.6-9.6 38.4-3.2 19.2-3.2 38.4-3.2 57.6 0 16 0 32 3.2 48 6.4 44.8 22.4 89.6 44.8 128 16 28.8 35.2 54.4 57.6 76.8 3.2 3.2 3.2 6.4 3.2 9.6v201.6c0 9.6 3.2 16 9.6 22.4 6.4 6.4 16 9.6 22.4 9.6h54.4c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-16 9.6-22.4v-48h86.4v48c0 9.6 3.2 16 9.6 22.4 6.4 6.4 16 9.6 22.4 9.6h54.4c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-16 9.6-22.4V560c0-3.2 0-6.4 3.2-9.6 22.4-22.4 41.6-48 57.6-76.8 16-28.8 25.6-57.6 32-89.6 0-9.6 0-19.2 0-28.8z M444.8 480c-19.2 0-35.2-16-35.2-35.2s16-35.2 35.2-35.2 35.2 16 35.2 35.2-16 35.2-35.2 35.2z M636.8 480c-19.2 0-35.2-16-35.2-35.2s16-35.2 35.2-35.2 35.2 16 35.2 35.2-16 35.2-35.2 35.2z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 1024 1024" fill="none" stroke="#d1d5db" strokeWidth={48} className="w-full h-full">
          <path d="M827.2 356.8c-3.2-22.4-9.6-44.8-19.2-64-9.6-25.6-22.4-48-38.4-67.2-6.4-6.4-12.8-16-22.4-22.4l-3.2-3.2c-6.4 19.2-16 35.2-28.8 51.2-16 16-35.2 28.8-57.6 35.2-22.4 6.4-44.8 6.4-67.2 0-22.4-6.4-41.6-19.2-57.6-35.2-16-16-28.8-35.2-35.2-57.6-6.4-22.4-6.4-44.8 0-67.2 6.4-22.4 19.2-41.6 35.2-57.6 9.6-9.6 22.4-19.2 35.2-25.6-32-6.4-64-6.4-96 0-28.8 6.4-57.6 16-83.2 32-25.6 16-48 35.2-67.2 57.6-12.8 16-22.4 32-32 51.2-6.4 12.8-9.6 25.6-16 38.4-3.2 12.8-6.4 25.6-9.6 38.4-3.2 19.2-3.2 38.4-3.2 57.6 0 16 0 32 3.2 48 6.4 44.8 22.4 89.6 44.8 128 16 28.8 35.2 54.4 57.6 76.8 3.2 3.2 3.2 6.4 3.2 9.6v201.6c0 9.6 3.2 16 9.6 22.4 6.4 6.4 16 9.6 22.4 9.6h54.4c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-16 9.6-22.4v-48h86.4v48c0 9.6 3.2 16 9.6 22.4 6.4 6.4 16 9.6 22.4 9.6h54.4c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-16 9.6-22.4V560c0-3.2 0-6.4 3.2-9.6 22.4-22.4 41.6-48 57.6-76.8 16-28.8 25.6-57.6 32-89.6 0-9.6 0-19.2 0-28.8z"/>
          <circle cx="444.8" cy="444.8" r="35.2" fill="#d1d5db"/>
          <circle cx="636.8" cy="444.8" r="35.2" fill="#d1d5db"/>
        </svg>
      )
    case 'cat':
      return filled ? (
        <svg viewBox="0 0 1024 1024" fill={color} className="w-full h-full">
          <path d="M816 192l-48 272c0 141.6-114.4 256-256 256S256 605.6 256 464L208 192l144 80c48-32 102.4-48 160-48s112 16 160 48l144-80zM416 480c0 19.2 12.8 32 32 32s32-12.8 32-32-12.8-32-32-32-32 12.8-32 32z m192 0c0 19.2-12.8 32-32 32s-32-12.8-32-32 12.8-32 32-32 32 12.8 32 32z m-64 64c0 0-16 32-32 32s-32-32-32-32h64z M512 784c64 0 121.6-25.6 163.2-67.2l38.4 38.4C665.6 803.2 592 832 512 832s-153.6-28.8-201.6-76.8l38.4-38.4C390.4 758.4 448 784 512 784z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 1024 1024" fill="none" stroke="#d1d5db" strokeWidth={48} className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" d="M816 192l-48 272c0 141.6-114.4 256-256 256S256 605.6 256 464L208 192l144 80c48-32 102.4-48 160-48s112 16 160 48l144-80z"/>
          <circle cx="432" cy="480" r="32" fill="#d1d5db"/>
          <circle cx="592" cy="480" r="32" fill="#d1d5db"/>
          <path strokeLinecap="round" d="M480 544s16 32 32 32 32-32 32-32"/>
          <path strokeLinecap="round" d="M512 784c64 0 121.6-25.6 163.2-67.2M512 784c-64 0-121.6-25.6-163.2-67.2"/>
        </svg>
      )
    default:
      return <Star {...iconProps} />
  }
}
