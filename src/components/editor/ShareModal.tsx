'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { X, Download, Copy } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  shareUrl: string
  title: string
}

export function ShareModal({ open, onClose, shareUrl, title }: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'link' | 'channel' | 'embed'>('link')
  const [embedHeight, setEmbedHeight] = useState(600)
  const [channelName, setChannelName] = useState('')
  const [channels, setChannels] = useState<string[]>(['xiaohongshu', 'wechat', 'douyin'])

  useEffect(() => {
    if (open && canvasRef.current && tab === 'link') {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      })
    }
  }, [open, shareUrl, tab])

  if (!open) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
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

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="${embedHeight}" frameborder="0" style="border:none;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"></iframe>`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-800">分享问卷</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-4 flex items-center gap-1 bg-gray-50 rounded-lg mx-5 mt-4 p-0.5">
          <button
            onClick={() => setTab('link')}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${tab === 'link' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            链接
          </button>
          <button
            onClick={() => setTab('channel')}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${tab === 'channel' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            渠道追踪
          </button>
          <button
            onClick={() => setTab('embed')}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${tab === 'embed' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            嵌入
          </button>
        </div>

        <div className="p-5 space-y-5">
          {tab === 'link' ? (
            <>
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
                    onClick={() => handleCopy(shareUrl)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              {/* Copy share text with title */}
              <button
                onClick={() => handleCopy(`${title}\n${shareUrl}`)}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                复制标题+链接（适合朋友圈）
              </button>

              {/* Download QR */}
              <button
                onClick={handleDownloadQR}
                className="w-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载二维码图片
              </button>
            </>
          ) : tab === 'channel' ? (
            <>
              {/* Channel tracking links */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500">为不同渠道生成带追踪参数的链接，统计各渠道来源</p>
                <div className="space-y-2">
                  {channels.map((ch, idx) => {
                    const url = `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}ref=${ch}`
                    return (
                      <div key={`${ch}-${idx}`} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20 truncate">{ch}</span>
                        <input value={url} readOnly className="flex-1 text-[11px] bg-gray-50 border rounded px-2 py-1.5 text-gray-500 truncate font-mono" />
                        <button
                          onClick={() => handleCopy(url)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                        >
                          复制
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="自定义渠道名称"
                    className="flex-1 text-sm border rounded-lg px-3 py-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && channelName.trim()) {
                        setChannels([...channels, channelName.trim()])
                        setChannelName('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (channelName.trim()) {
                        setChannels([...channels, channelName.trim()])
                        setChannelName('')
                      }
                    }}
                    className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    添加
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">回复数据中将记录 ref 来源，可在统计中查看</p>
              </div>
            </>
          ) : (
            <>
              {/* Embed options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">高度:</label>
                  <div className="flex items-center gap-1">
                    {[400, 500, 600, 700].map(h => (
                      <button
                        key={h}
                        onClick={() => setEmbedHeight(h)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${embedHeight === h ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {h}px
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={embedCode}
                    readOnly
                    rows={3}
                    className="w-full text-xs bg-gray-50 border rounded-lg px-3 py-2.5 text-gray-600 font-mono resize-none"
                  />
                </div>
                <button
                  onClick={() => handleCopy(embedCode)}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? '已复制' : '复制嵌入代码'}
                </button>
                <p className="text-[11px] text-gray-400 text-center">将代码粘贴到你的网站 HTML 中即可嵌入问卷</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
