'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SurveyField } from '@/lib/types'
import { nanoid } from 'nanoid'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GeneratedSurvey {
  title: string
  description: string
  fields: { type: string; label: string; options?: string[]; required?: boolean; multiline?: boolean; sliderMin?: number; sliderMax?: number }[]
}

interface AIGenerateDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  onGenerated: (survey: { title: string; description: string; fields: SurveyField[] }) => void
}

export function AIGenerateDialog({ open, onClose, userId, onGenerated }: AIGenerateDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [generated, setGenerated] = useState<GeneratedSurvey | null>(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && messages.length === 0) {
      // AI sends first message
      setMessages([{ role: 'assistant', content: '你好！我是问卷设计助手，可以帮你快速生成专业问卷。\n\n请告诉我你想做什么主题的问卷？比如客户满意度调查、活动反馈、员工调研等。' }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    await sendToApi(newMessages)
  }

  const sendToApi = async (chatHistory: ChatMessage[]) => {
    setStreaming(true)
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, messages: chatHistory }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '请求失败' }))
        setError((err as { error?: string }).error || '请求失败')
        setStreaming(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) { setStreaming(false); return }

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              // Display without [GENERATE] and JSON
              const displayContent = fullContent.includes('[GENERATE]')
                ? fullContent.split('[GENERATE]')[0].trim()
                : fullContent
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: displayContent }
                return updated
              })
            }
          } catch {
            // skip parse errors
          }
        }
      }

      // Check for [GENERATE]
      if (fullContent.includes('[GENERATE]')) {
        const jsonStr = fullContent.split('[GENERATE]')[1]?.trim()
        if (jsonStr) {
          try {
            // Extract JSON - handle potential markdown code blocks
            const cleanJson = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '').trim()
            const survey = JSON.parse(cleanJson) as GeneratedSurvey
            setGenerated(survey)
          } catch {
            setError('问卷生成格式错误，请重试')
          }
        }
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setStreaming(false)
    }
  }

  const handleConfirm = () => {
    if (!generated) return
    const fields: SurveyField[] = generated.fields.map(f => ({
      id: nanoid(8),
      type: f.type as SurveyField['type'],
      label: f.label,
      required: f.required ?? true,
      options: f.options,
      multiline: f.multiline,
      sliderMin: f.sliderMin,
      sliderMax: f.sliderMax,
    }))
    onGenerated({ title: generated.title, description: generated.description, fields })
    handleClose()
  }

  const handleClose = () => {
    setMessages([])
    setGenerated(null)
    setError('')
    setInput('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogTitle className="px-5 pt-4 pb-2 border-b text-base font-semibold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </span>
          AI 生成问卷
        </DialogTitle>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}>
                {msg.content || (streaming && i === messages.length - 1 ? '思考中...' : '')}
              </div>
            </div>
          ))}
          {error && (
            <div className="text-center">
              <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Generated survey preview */}
        {generated && (
          <div className="mx-4 mb-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm font-medium text-green-800">问卷已生成</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{generated.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{generated.description}</p>
            <p className="text-xs text-gray-400 mt-2">{generated.fields.length} 道题目</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-xs">
                使用此问卷
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGenerated(null)} className="text-xs">
                继续修改
              </Button>
            </div>
          </div>
        )}

        {/* Input area */}
        {!generated && (
          <div className="p-3 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="描述你的问卷需求..."
                disabled={streaming}
                className="flex-1 h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 disabled:opacity-50"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
