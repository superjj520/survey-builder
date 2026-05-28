'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { SurveyField, SurveySettings, DEFAULT_SETTINGS } from '@/lib/types'

interface EditorState {
  title: string
  description: string
  fields: SurveyField[]
  settings: SurveySettings
  selectedFieldId: string | null
  isDirty: boolean
}

type EditorAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'ADD_FIELD'; payload: SurveyField }
  | { type: 'UPDATE_FIELD'; payload: { id: string; updates: Partial<SurveyField> } }
  | { type: 'REMOVE_FIELD'; payload: string }
  | { type: 'DUPLICATE_FIELD'; payload: string }
  | { type: 'REORDER_FIELDS'; payload: SurveyField[] }
  | { type: 'SELECT_FIELD'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SurveySettings> }
  | { type: 'LOAD_SURVEY'; payload: { title: string; description: string; fields: SurveyField[]; settings: SurveySettings } }
  | { type: 'MARK_SAVED' }

const initialState: EditorState = {
  title: '未命名问卷',
  description: '',
  fields: [],
  settings: DEFAULT_SETTINGS,
  selectedFieldId: null,
  isDirty: false,
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload, isDirty: true }
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload, isDirty: true }
    case 'ADD_FIELD':
      return { ...state, fields: [...state.fields, action.payload], selectedFieldId: action.payload.id, isDirty: true }
    case 'UPDATE_FIELD':
      return {
        ...state,
        fields: state.fields.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
        isDirty: true,
      }
    case 'REMOVE_FIELD':
      return {
        ...state,
        fields: state.fields.filter((f) => f.id !== action.payload),
        selectedFieldId: state.selectedFieldId === action.payload ? null : state.selectedFieldId,
        isDirty: true,
      }
    case 'DUPLICATE_FIELD': {
      const src = state.fields.find(f => f.id === action.payload)
      if (!src) return state
      const copy = { ...src, id: src.id + '_' + Date.now().toString(36) }
      const idx = state.fields.findIndex(f => f.id === action.payload)
      const fields = [...state.fields]
      fields.splice(idx + 1, 0, copy)
      return { ...state, fields, selectedFieldId: copy.id, isDirty: true }
    }
    case 'REORDER_FIELDS':
      return { ...state, fields: action.payload, isDirty: true }
    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.payload }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload }, isDirty: true }
    case 'LOAD_SURVEY':
      return { ...state, ...action.payload, isDirty: false, selectedFieldId: null }
    case 'MARK_SAVED':
      return { ...state, isDirty: false }
    default:
      return state
  }
}

const EditorContext = createContext<{
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
} | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)
  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) throw new Error('useEditor must be used within EditorProvider')
  return context
}
