'use client'

import React, { createContext, useContext, useReducer, useCallback, useRef, ReactNode } from 'react'
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
  | { type: 'UNDO' }
  | { type: 'REDO' }

const initialState: EditorState = {
  title: '未命名问卷',
  description: '',
  fields: [],
  settings: DEFAULT_SETTINGS,
  selectedFieldId: null,
  isDirty: false,
}

// Actions that should be recorded in history
const HISTORY_ACTIONS = new Set(['ADD_FIELD', 'UPDATE_FIELD', 'REMOVE_FIELD', 'DUPLICATE_FIELD', 'REORDER_FIELDS', 'SET_TITLE', 'SET_DESCRIPTION', 'UPDATE_SETTINGS'])

interface HistoryEntry {
  title: string
  description: string
  fields: SurveyField[]
  settings: SurveySettings
}

const MAX_HISTORY = 30

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
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
} | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(editorReducer, initialState)
  const historyRef = useRef<HistoryEntry[]>([])
  const futureRef = useRef<HistoryEntry[]>([])
  const skipHistoryRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const getSnapshot = (s: EditorState): HistoryEntry => ({
    title: s.title, description: s.description, fields: s.fields, settings: s.settings,
  })

  const dispatch = useCallback((action: EditorAction) => {
    if (action.type === 'UNDO' || action.type === 'REDO') {
      // handled separately
      return
    }
    if (HISTORY_ACTIONS.has(action.type) && !skipHistoryRef.current) {
      // Save current state to history before applying action
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), getSnapshot(stateRef.current)]
      futureRef.current = []
    }
    baseDispatch(action)
  }, [])

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    futureRef.current = [...futureRef.current, getSnapshot(stateRef.current)]
    skipHistoryRef.current = true
    baseDispatch({ type: 'LOAD_SURVEY', payload: prev })
    baseDispatch({ type: 'SET_TITLE', payload: prev.title }) // mark dirty
    skipHistoryRef.current = false
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    historyRef.current = [...historyRef.current, getSnapshot(stateRef.current)]
    skipHistoryRef.current = true
    baseDispatch({ type: 'LOAD_SURVEY', payload: next })
    baseDispatch({ type: 'SET_TITLE', payload: next.title }) // mark dirty
    skipHistoryRef.current = false
  }, [])

  const canUndo = historyRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  return (
    <EditorContext.Provider value={{ state, dispatch, undo, redo, canUndo, canRedo }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) throw new Error('useEditor must be used within EditorProvider')
  return context
}
