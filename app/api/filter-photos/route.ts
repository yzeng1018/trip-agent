import { NextRequest } from 'next/server'
import sharp from 'sharp'
import { TRAVEL_PHOTOS } from '@/lib/photos'

export const maxDuration = 30

async function scorePhoto(url: string): Promise<number> {
  try {
    const res = await fetch(url.replace('w=1920', 'w=80').replace('q=80', 'q=20'), {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return 0
    const buf = Buffer.from(await res.arrayBuffer())
    const { data } = await sharp(buf).resize(50, 50).raw().toBuffer({ resolveWithObject: true })

    // Collect per-pixel brightness
    const brightnesses: number[] = []
    const buckets = new Set<number>()
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      brightnesses.push(r * 0.299 + g * 0.587 + b * 0.114)
      buckets.add((Math.floor(r / 32) << 6) | (Math.floor(g / 32) << 3) | Math.floor(b / 32))
    }

    // Median brightness (not mean) — avoids bright-spot skew in dark images
    brightnesses.sort((a, b) => a - b)
    const median = brightnesses[Math.floor(brightnesses.length / 2)]

    return median >= 55 && buckets.size >= 25 ? 1 : 0
  } catch {
    return 0
  }
}

let cachedGood: string[] | null = null

export async function GET(_req: NextRequest) {
  if (cachedGood) {
    return Response.json({ photos: cachedGood })
  }

  const results = await Promise.allSettled(TRAVEL_PHOTOS.map(scorePhoto))
  const good = TRAVEL_PHOTOS.filter((_, i) => {
    const r = results[i]
    return r.status === 'fulfilled' && r.value === 1
  })

  cachedGood = good.length >= 5 ? good : TRAVEL_PHOTOS
  return Response.json({ photos: cachedGood })
}
