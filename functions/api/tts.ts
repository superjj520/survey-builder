import { corsHeaders, errorResponse, optionsResponse } from '../shared/cors'

// Edge TTS voice list (Chinese)
const VOICE_MAP: Record<string, string> = {
  '晓晓': 'zh-CN-XiaoxiaoNeural',
  '云希': 'zh-CN-YunxiNeural',
  '晓伊': 'zh-CN-XiaoyiNeural',
  '云扬': 'zh-CN-YunyangNeural',
  '晓悠': 'zh-CN-XiaoyouNeural',
  '云枫': 'zh-CN-YunfengNeural',
  '晓墨': 'zh-CN-XiaomoNeural',
  '晓睿': 'zh-CN-XiaoruiNeural',
  '晓双': 'zh-CN-XiaoshuangNeural',
  '晓颜': 'zh-CN-XiaoyanNeural',
  '晓辰': 'zh-CN-XiaochenNeural',
  '晓寒': 'zh-CN-XiaohanNeural',
  '晓梦': 'zh-CN-XiaomengNeural',
  '晓秋': 'zh-CN-XiaoqiuNeural',
  '晓柔': 'zh-CN-XiaorouNeural',
  '云皓': 'zh-CN-YunhaoNeural',
  '云建': 'zh-CN-YunjianNeural',
  '云夏': 'zh-CN-YunxiaNeural',
  '云泽': 'zh-CN-YunzeNeural',
}

const TOKEN_URL = 'https://edge.microsoft.com/translate/auth'
const TTS_URL = 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken'
const SYNTH_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'

// Generate SSML
function buildSSML(text: string, voice: string, rate: string = '+0%', pitch: string = '+0Hz'): string {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${voice}">
    <prosody rate="${rate}" pitch="${pitch}">
      ${escapeXml(text)}
    </prosody>
  </voice>
</speak>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Use Edge TTS via HTTP (fallback: direct SSML to Azure endpoint)
async function synthesize(text: string, voiceName: string, rate?: string): Promise<ArrayBuffer | null> {
  const ssml = buildSSML(text, voiceName, rate || '+0%')

  // Try the free Edge read-aloud endpoint
  const boundary = '----EdgeTTS' + Date.now()
  const body = `${boundary}\r\nContent-Type: application/ssml+xml\r\n\r\n${ssml}\r\n${boundary}--`

  try {
    // Use the Bing speech synthesis REST endpoint
    const response = await fetch('https://eastus.tts.speech.microsoft.com/cognitiveservices/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://azure.microsoft.com',
        'Referer': 'https://azure.microsoft.com/',
      },
      body: ssml,
    })

    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch {}

  // Fallback: use the Edge browser read-aloud API
  try {
    const trustToken = await fetch('https://edge.microsoft.com/translate/auth', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0' }
    })
    const token = await trustToken.text()

    const resp = await fetch(`https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${token}&ConnectionId=${crypto.randomUUID().replace(/-/g, '')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      },
      body: ssml,
    })

    if (resp.ok) {
      return await resp.arrayBuffer()
    }
  } catch {}

  return null
}

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

    if (!text || text.length === 0) {
      return errorResponse('text is required')
    }

    if (text.length > 500) {
      return errorResponse('text too long (max 500 chars)')
    }

    // Clean text
    const cleanText = text
      .replace(/\*[^*]+\*/g, '') // remove *actions*
      .replace(/\[[^\]]+\]/g, '') // remove [markers]
      .trim()

    if (!cleanText) {
      return errorResponse('no speakable text')
    }

    // Resolve voice name
    let voiceName = 'zh-CN-XiaoxiaoNeural' // default
    if (voice) {
      voiceName = VOICE_MAP[voice] || voice
      // If it doesn't look like a full voice name, try matching
      if (!voiceName.includes('Neural')) {
        const match = Object.entries(VOICE_MAP).find(([k]) => k.includes(voice))
        if (match) voiceName = match[1]
      }
    }

    // Try Azure TTS with key if available
    if (context.env.AZURE_TTS_KEY) {
      const ssml = buildSSML(cleanText, voiceName, rate || '+0%')
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
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }

    // Free path: Edge TTS
    const audio = await synthesize(cleanText, voiceName, rate)
    if (!audio) {
      return errorResponse('TTS synthesis failed', 502)
    }

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return errorResponse('TTS error', 500, String(e))
  }
}
