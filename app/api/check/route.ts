import { NextRequest } from 'next/server'
import { checkItinerary } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { message, plan } = await req.json()
  if (!message || !plan) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
  const result = await checkItinerary(message, plan)
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
