import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  if (!content?.trim()) {
    return new Response(JSON.stringify({ error: '请输入反馈内容' }), { status: 400 })
  }
  const { error } = await supabase.from('feedback').insert({ content: content.trim() })
  if (error) {
    return new Response(JSON.stringify({ error: '提交失败，请稍后再试' }), { status: 500 })
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
