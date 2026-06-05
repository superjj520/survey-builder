'use client'

import { useRef, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import QRCode from 'qrcode'

interface ShareCardProps {
  surveyTitle: string
  resultLabel: string
  resultDescription: string
  score?: number
  primaryColor: string
  shareUrl: string
  onClose: () => void
}

export function ShareCard({
  surveyTitle,
  resultLabel,
  resultDescription,
  score,
  primaryColor,
  shareUrl,
  onClose,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    generateCard()
  }, [])

  async function generateCard() {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = 750
    const H = 1334
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Soft gradient background (小红书风格: warm, soft tones)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, lightenColor(primaryColor, 50))
    grad.addColorStop(0.4, '#ffffff')
    grad.addColorStop(1, lightenColor(primaryColor, 60))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Decorative blobs (soft, organic shapes)
    ctx.globalAlpha = 0.06
    ctx.fillStyle = primaryColor
    ctx.beginPath()
    ctx.arc(650, 150, 200, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(100, 1200, 180, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(700, 900, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Main white card
    const cardX = 40
    const cardY = 160
    const cardW = W - 80
    const cardH = H - 350
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.08)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 12
    roundRect(ctx, cardX, cardY, cardW, cardH, 36)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // Colored accent bar on top of card
    ctx.fillStyle = primaryColor
    roundRect(ctx, cardX, cardY, cardW, 8, 36)
    ctx.fill()
    // Cover the bottom corners of accent
    ctx.fillStyle = primaryColor
    ctx.fillRect(cardX + 36, cardY, cardW - 72, 8)

    // Emoji decoration (top)
    ctx.font = '48px serif'
    ctx.textAlign = 'center'
    ctx.fillText('✨', 130, cardY + 70)
    ctx.fillText('🎯', W - 130, cardY + 70)

    // Survey title
    ctx.fillStyle = '#374151'
    ctx.font = '500 30px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, surveyTitle, W / 2, cardY + 100, cardW - 100, 40)

    // Decorative line
    const lineY = cardY + 150
    ctx.strokeStyle = primaryColor + '25'
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(cardX + 80, lineY)
    ctx.lineTo(cardX + cardW - 80, lineY)
    ctx.stroke()
    ctx.setLineDash([])

    // Score badge (if scoring mode)
    if (score !== undefined) {
      const cx = W / 2
      const cy = cardY + 280
      // Outer ring
      ctx.beginPath()
      ctx.arc(cx, cy, 72, 0, Math.PI * 2)
      ctx.fillStyle = primaryColor + '12'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 72, 0, Math.PI * 2)
      ctx.strokeStyle = primaryColor + '40'
      ctx.lineWidth = 3
      ctx.stroke()
      // Score number
      ctx.fillStyle = primaryColor
      ctx.font = 'bold 56px "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(score), cx, cy - 4)
      ctx.fillStyle = primaryColor + '80'
      ctx.font = '400 18px "PingFang SC", sans-serif'
      ctx.fillText('分', cx, cy + 32)
      ctx.textBaseline = 'alphabetic'
    }

    // Result label — big, bold
    const labelY = score !== undefined ? cardY + 400 : cardY + 260
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 48px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, resultLabel, W / 2, labelY, cardW - 100, 60)

    // Result description
    const descY = labelY + 80
    ctx.fillStyle = '#6b7280'
    ctx.font = '400 26px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, resultDescription, W / 2, descY, cardW - 120, 38)

    // Call-to-action ribbon
    const ribbonY = cardY + cardH - 240
    ctx.fillStyle = primaryColor + '0a'
    roundRect(ctx, cardX + 40, ribbonY, cardW - 80, 80, 16)
    ctx.fill()
    ctx.fillStyle = primaryColor
    ctx.font = '500 24px "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📱 扫码来测试同款', W / 2, ribbonY + 50)

    // QR Code area (bottom of card)
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#1f2937', light: '#ffffff' },
      })
      const qrImg = new Image()
      qrImg.onload = () => {
        const qrSize = 140
        const qrX = W / 2 - qrSize / 2
        const qrY = cardY + cardH - 140
        // White background for QR
        ctx.fillStyle = '#ffffff'
        roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12)
        ctx.fill()
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12)
        ctx.stroke()
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

        // Bottom brand area
        ctx.fillStyle = primaryColor
        ctx.font = 'bold 22px "PingFang SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('趣测小屋', W / 2, H - 130)
        ctx.fillStyle = '#9ca3af'
        ctx.font = '400 18px "PingFang SC", sans-serif'
        ctx.fillText('jydigtal.com · 免费创建你的趣味测试', W / 2, H - 100)

        // Timestamp
        ctx.fillStyle = '#d1d5db'
        ctx.font = '400 16px "PingFang SC", sans-serif'
        ctx.fillText(new Date().toLocaleDateString(), W / 2, H - 65)

        // Export
        const url = canvas.toDataURL('image/png')
        setImageUrl(url)
        setGenerating(false)
      }
      qrImg.src = qrDataUrl
    } catch {
      ctx.fillStyle = primaryColor
      ctx.font = 'bold 22px "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('趣测小屋', W / 2, H - 100)
      const url = canvas.toDataURL('image/png')
      setImageUrl(url)
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounceIn">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">分享结果卡片</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {generating ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">生成中...</p>
              </div>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="分享卡片" className="w-full rounded-xl shadow-sm" />
          ) : null}

          <canvas ref={canvasRef} className="hidden" />

          {imageUrl && (
            <div className="mt-4 space-y-2">
              <a
                href={imageUrl}
                download="share-result.png"
                className="block w-full text-center py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                保存图片
              </a>
              <p className="text-center text-[10px] text-gray-400">长按图片也可保存到相册</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helpers
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const chars = text.split('')
  let line = ''
  let currentY = y
  for (const char of chars) {
    const testLine = line + char
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = char
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100))
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100))
  const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}
