import { NextRequest } from 'next/server'
import { generateItineraryStream } from '@/lib/ai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: '请描述你的旅行需求' }), { status: 400 })
  }
  const stream = generateItineraryStream(message)
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
