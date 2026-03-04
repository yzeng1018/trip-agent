import { NextRequest, NextResponse } from 'next/server'
import { generateItinerary } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: '请描述你的旅行需求' }, { status: 400 })
    }
    const plan = await generateItinerary(message)
    return NextResponse.json({ plan })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '行程生成失败，请重试'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
