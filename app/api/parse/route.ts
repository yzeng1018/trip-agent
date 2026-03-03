import { NextRequest, NextResponse } from 'next/server'
import { parseIntent } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: '请输入出行需求' }, { status: 400 })
    }
    const intent = await parseIntent(message)
    return NextResponse.json({ intent })
  } catch (err) {
    const message = err instanceof Error ? err.message : '解析失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
