import { corsHeaders, errorResponse, optionsResponse } from '../shared/cors'

// ─── Edge TTS Implementation (Cloudflare Workers compatible) ─────────────────

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM_FULL_VERSION = '143.0.3650.75'
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0]
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`
const SYNTHESIS_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'

const VOICE_MAP: Record<string, string> = {
  '晓晓': 'zh-CN-XiaoxiaoNeural',
  '云希': 'zh-CN-YunxiNeural',
  '晓伊': 'zh-CN-XiaoyiNeural',
  '云扬': 'zh-CN-YunyangNeural',
  '晓墨': 'zh-CN-XiaomoNeural',
  '晓梦': 'zh-CN-XiaomengNeural',
  '云枫': 'zh-CN-YunfengNeural',
  '晓柔': 'zh-CN-XiaorouNeural',
  '云皓': 'zh-CN-YunhaoNeural',
}

const UPGRADE_HEADERS: Record<string, string> = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  'Sec-WebSocket-Version': '13',
  Upgrade: 'websocket',
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function removeInvalidXml(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ')
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:.]/g, '').slice(0, -1)
}

function makeConnectionId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

function makeMuid(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

async function makeSecMsGec(): Promise<string> {
  const winEpoch = 11644473600
  const secondsToNs = 1e9
  let ticks = Date.now() / 1000
  ticks += winEpoch
  ticks -= ticks % 300
  ticks *= secondsToNs / 100
  const payload = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function buildSynthesisUrl(secMsGec: string, connectionId: string): string {
  const url = new URL(SYNTHESIS_URL)
  url.searchParams.set('TrustedClientToken', TRUSTED_CLIENT_TOKEN)
  url.searchParams.set('Sec-MS-GEC', secMsGec)
  url.searchParams.set('Sec-MS-GEC-Version', SEC_MS_GEC_VERSION)
  url.searchParams.set('ConnectionId', connectionId)
  return url.toString()
}

function buildConfigMessage(): string {
  return (
    `X-Timestamp:${timestamp()}\r\n` +
    'Content-Type:application/json; charset=utf-8\r\n' +
    'Path:speech.config\r\n\r\n' +
    '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
  )
}

function buildSsmlMessage(requestId: string, voice: string, text: string): string {
  const ssml =
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>" +
    `<voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(removeInvalidXml(text))}</prosody></voice></speak>`
  return (
    `X-RequestId:${requestId}\r\n` +
    'Content-Type:application/ssml+xml\r\n' +
    `X-Timestamp:${timestamp()}Z\r\n` +
    'Path:ssml\r\n\r\n' +
    ssml
  )
}

function normalizeVoiceName(voice: string): string {
  const trimmed = voice.trim()
  const match = /^([a-z]{2,})-([A-Z]{2,})-(.+Neural)$/.exec(trimmed)
  if (!match) return trimmed
  const [, lang, region, name] = match
  return `Microsoft Server Speech Text to Speech Voice (${lang}-${region}, ${name})`
}

function parseBinaryAudioFrame(data: Uint8Array): { headers: Record<string, string>; body: Uint8Array } {
  const headerLength = (data[0] << 8) | data[1]
  const headerText = new TextDecoder().decode(data.slice(2, 2 + headerLength))
  const headers: Record<string, string> = {}
  for (const line of headerText.split('\r\n')) {
    const idx = line.indexOf(':')
    if (idx > 0) headers[line.slice(0, idx)] = line.slice(idx + 1).trim()
  }
  return { headers, body: data.slice(2 + headerLength) }
}

// ─── API Handler ─────────────────────────────────────────────────────────────

interface Env {
  AZURE_TTS_KEY?: string
}

export const onRequestOptions: PagesFunction = async () => optionsResponse()

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { text, voice, rate } = await context.request.json() as {
      text?: string
      voice?: string
      rate?: string
    }

    if (!text || text.length === 0) return errorResponse('text is required')
    if (text.length > 500) return errorResponse('text too long (max 500 chars)')

    const cleanText = text.replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim()
    if (!cleanText) return errorResponse('no speakable text')

    // Resolve voice
    let voiceName = 'zh-CN-XiaoxiaoNeural'
    if (voice) {
      voiceName = VOICE_MAP[voice] || voice
      if (!voiceName.includes('Neural')) {
        const match = Object.entries(VOICE_MAP).find(([k]) => k.includes(voice))
        if (match) voiceName = match[1]
      }
    }

    // Method 1: Azure TTS with key
    if (context.env.AZURE_TTS_KEY) {
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><voice name='${voiceName}'><prosody rate='${rate || '+0%'}'>${escapeXml(cleanText)}</prosody></voice></speak>`
      const resp = await fetch('https://eastus.tts.speech.microsoft.com/cognitiveservices/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'Ocp-Apim-Subscription-Key': context.env.AZURE_TTS_KEY,
        },
        body: ssml,
      })
      if (resp.ok) {
        const audio = await resp.arrayBuffer()
        return new Response(audio, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
        })
      }
    }

    // Method 2: Free Edge TTS via WebSocket
    const secMsGec = await makeSecMsGec()
    const connectionId = makeConnectionId()
    const wsUrl = buildSynthesisUrl(secMsGec, connectionId)

    const wsResp = await fetch(wsUrl, {
      headers: {
        ...UPGRADE_HEADERS,
        Cookie: `muid=${makeMuid()};`,
      },
    }) as Response & { webSocket?: WebSocket }

    if (wsResp.status !== 101 || !wsResp.webSocket) {
      return errorResponse('WebSocket upgrade failed', 502)
    }

    const ws = wsResp.webSocket
    ws.accept()

    // Collect audio data
    const audioChunks: Uint8Array[] = []
    let audioReceived = false

    const audioPromise = new Promise<Uint8Array>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('TTS timeout')), 15000)

      ws.addEventListener('message', (event) => {
        const { data } = event

        if (typeof data === 'string') {
          // Check for turn.end
          if (data.includes('Path:turn.end')) {
            clearTimeout(timeout)
            try { ws.close() } catch {}
            const totalLen = audioChunks.reduce((sum, c) => sum + c.byteLength, 0)
            const result = new Uint8Array(totalLen)
            let offset = 0
            for (const chunk of audioChunks) {
              result.set(chunk, offset)
              offset += chunk.byteLength
            }
            resolve(result)
          }
          return
        }

        // Binary: extract audio
        let binary: Uint8Array
        if (data instanceof ArrayBuffer) {
          binary = new Uint8Array(data)
        } else {
          return
        }

        try {
          const { headers, body } = parseBinaryAudioFrame(binary)
          if (headers.Path === 'audio' && body.length > 0) {
            audioReceived = true
            audioChunks.push(body)
          }
        } catch {}
      })

      ws.addEventListener('close', () => {
        clearTimeout(timeout)
        if (audioReceived) {
          const totalLen = audioChunks.reduce((sum, c) => sum + c.byteLength, 0)
          const result = new Uint8Array(totalLen)
          let offset = 0
          for (const chunk of audioChunks) {
            result.set(chunk, offset)
            offset += chunk.byteLength
          }
          resolve(result)
        } else {
          reject(new Error('No audio received'))
        }
      })

      ws.addEventListener('error', () => {
        clearTimeout(timeout)
        reject(new Error('WebSocket error'))
      })
    })

    // Send messages
    ws.send(buildConfigMessage())
    ws.send(buildSsmlMessage(makeConnectionId(), normalizeVoiceName(voiceName), cleanText))

    try {
      const audio = await audioPromise
      return new Response(audio.buffer, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
      })
    } catch (e) {
      return errorResponse('TTS failed: ' + String(e), 502)
    }
  } catch (e) {
    return errorResponse('TTS error', 500, String(e))
  }
}
