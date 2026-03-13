import { NextRequest } from 'next/server'
import { generateSkeleton } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message?.trim()) return new Response('', { status: 400 })
  const skeleton = await generateSkeleton(message)
  return new Response(skeleton || '', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
