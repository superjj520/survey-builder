'use client'

import { FieldPalette } from './FieldPalette'
import { FieldCanvas } from './FieldCanvas'
import { FieldConfig } from './FieldConfig'
import { EditorProvider, useEditor } from './EditorContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Survey } from '@/lib/types'

interface EditorLayoutProps {
  survey?: Survey
  onSave: (data: { title: string; description: string; fields: unknown[]; settings: unknown }) => Promise<void>
}

function EditorContent({ onSave }: { onSave: EditorLayoutProps['onSave'] }) {
  const { state, dispatch } = useEditor()

  const handleSave = async () => {
    await onSave({
      title: state.title,
      description: state.description,
      fields: state.fields,
      settings: state.settings,
    })
    dispatch({ type: 'MARK_SAVED' })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center gap-4 bg-white">
        <div className="flex-1">
          <Input
            value={state.title}
            onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
            className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="问卷标题"
          />
          <Textarea
            value={state.description}
            onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
            className="text-sm text-muted-foreground border-none shadow-none px-0 resize-none focus-visible:ring-0 min-h-0 h-6"
            placeholder="问卷描述（可选）"
            rows={1}
          />
        </div>
        <Button onClick={handleSave} disabled={!state.isDirty}>
          {state.isDirty ? '保存' : '已保存'}
        </Button>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r overflow-y-auto bg-gray-50 p-4">
          <FieldPalette />
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <FieldCanvas />
        </div>
        <div className="w-80 border-l overflow-y-auto bg-white p-4">
          <FieldConfig />
        </div>
      </div>
    </div>
  )
}

export function EditorLayout({ survey, onSave }: EditorLayoutProps) {
  return (
    <EditorProvider>
      <EditorInitializer survey={survey} />
      <EditorContent onSave={onSave} />
    </EditorProvider>
  )
}

function EditorInitializer({ survey }: { survey?: Survey }) {
  const { dispatch } = useEditor()

  // Load survey data on mount
  React.useEffect(() => {
    if (survey) {
      dispatch({
        type: 'LOAD_SURVEY',
        payload: {
          title: survey.title,
          description: survey.description,
          fields: survey.fields,
          settings: survey.settings,
        },
      })
    }
  }, [survey, dispatch])

  return null
}

import React from 'react'
