import { corsHeaders, errorResponse, optionsResponse } from '../shared/cors'

interface Env {
  AI: {
    run: (model: string, inputs: Record<string, unknown>) => Promise<ArrayBuffer | ReadableStream>
  }
}

export const onRequestOptions: PagesFunction = async () => optionsResponse()

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { text } = await context.request.json() as { text?: string }

    if (!text || text.length === 0) return errorResponse('text is required')
    if (text.length > 500) return errorResponse('text too long (max 500 chars)')

    const cleanText = text.replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim()
    if (!cleanText) return errorResponse('no speakable text')

    // Try Workers AI TTS
    if (context.env.AI) {
      try {
        const result = await context.env.AI.run('@cf/myshell-ai/melotts', {
          text: cleanText,
          language: 'Chinese',
        })
        return new Response(result as ArrayBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } catch {
        // AI model failed, return 501 to signal frontend fallback
      }
    }

    // No AI binding or AI failed — tell frontend to use client-side TTS
    return errorResponse('Server TTS unavailable, use client fallback', 501)
  } catch (e) {
    return errorResponse('TTS error', 500, String(e))
  }
}
