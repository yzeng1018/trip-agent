import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400 })
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-CN`,
    { headers: { 'User-Agent': 'Tabi-TravelApp/1.0' } }
  )

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'geocode failed' }), { status: 502 })
  }

  const data = await res.json()
  const addr = data.address ?? {}

  // Pick the most specific administrative level available
  const city =
    addr.city ?? addr.town ?? addr.county ?? addr.state_district ?? addr.state ?? null

  return new Response(JSON.stringify({ city }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
