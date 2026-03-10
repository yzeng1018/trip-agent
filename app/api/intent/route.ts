import { NextRequest } from 'next/server'
import { parseFormIntent } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message) return new Response(JSON.stringify({}), { status: 200 })
  const result = await parseFormIntent(message)
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
