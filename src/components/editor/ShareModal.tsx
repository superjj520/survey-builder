'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  shareUrl: string
  title: string
}

export function ShareModal({ open, onClose, shareUrl, title }: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      })
    }
  }, [open, shareUrl])

  if (!open) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `${title}-二维码.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-800">分享问卷</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-lg border border-gray-100" />
            <p className="text-xs text-gray-400 mt-2">扫描二维码填写问卷</p>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500">分享链接</label>
            <div className="flex gap-2">
              <input
                value={shareUrl}
                readOnly
                className="flex-1 text-sm bg-gray-50 border rounded-lg px-3 py-2 text-gray-600 truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  copied ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          {/* Download QR */}
          <button
            onClick={handleDownloadQR}
            className="w-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载二维码图片
          </button>
        </div>
      </div>
    </div>
  )
}
