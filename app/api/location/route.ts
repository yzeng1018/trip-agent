import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  // Vercel injects these headers automatically on their edge network
  const city = req.headers.get('x-vercel-ip-city')
  const country = req.headers.get('x-vercel-ip-country')

  if (!city) {
    return new Response(JSON.stringify({ city: null }), { status: 200 })
  }

  // City name is URL-encoded (e.g. "Hong%20Kong")
  const decoded = decodeURIComponent(city)
  const countryCode = country ?? ''

  return new Response(JSON.stringify({ city: decoded, country: countryCode }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
