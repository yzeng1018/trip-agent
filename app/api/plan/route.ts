import { NextRequest } from 'next/server'
import { generateItineraryStream } from '@/lib/ai'
import { getSupabase } from '@/lib/supabase'

export const maxDuration = 60

async function saveLog(input: string, captureStream: ReadableStream, startTime: number, ip: string) {
  const reader = captureStream.getReader()
  const chunks: string[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(typeof value === 'string' ? value : new TextDecoder().decode(value))
    }
    await getSupabase().from('logs').insert({
      user_input: input,
      ai_output: chunks.join(''),
      duration_ms: Date.now() - startTime,
      ip,
    })
  } catch {
    // logging failure should never break the main response
  }
}

export async function POST(req: NextRequest) {
  const { message, skeleton } = await req.json()
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: '请描述你的旅行需求' }), { status: 400 })
  }
  const startTime = Date.now()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const stream = generateItineraryStream(message, skeleton || undefined)
  const [responseStream, captureStream] = stream.tee()
  saveLog(message, captureStream, startTime, ip)
  return new Response(responseStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
