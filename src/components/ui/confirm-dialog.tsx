'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} className="h-9 px-4">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`h-9 px-4 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for imperative use
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: 'danger' | 'default'
    resolve?: (value: boolean) => void
  }>({ open: false, title: '' })

  const confirm = useCallback((opts: { title: string; description?: string; variant?: 'danger' | 'default' }) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve })
    })
  }, [])

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmText="确定"
      cancelText="取消"
      onConfirm={() => { state.resolve?.(true); setState({ open: false, title: '' }) }}
      onCancel={() => { state.resolve?.(false); setState({ open: false, title: '' }) }}
    />
  )

  return { confirm, dialog }
}
