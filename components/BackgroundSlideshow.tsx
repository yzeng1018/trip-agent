'use client'

import { useEffect, useRef, useState } from 'react'

interface Props { photos: string[]; intervalMs?: number }

const imageCache: Record<string, HTMLImageElement> = {}

function preload(url: string): Promise<void> {
  if (imageCache[url]?.complete) return Promise.resolve()
  return new Promise(resolve => {
    const img = imageCache[url] ?? new Image()
    imageCache[url] = img
    if (img.complete) { resolve(); return }
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

function pick(photos: string[], exclude?: string) {
  const pool = exclude ? photos.filter(p => p !== exclude) : photos
  return pool[Math.floor(Math.random() * pool.length)]
}

// Load a tiny thumbnail onto canvas and check brightness + color diversity
function analyzePhoto(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 50
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(true); return }
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const buckets = new Set<number>()
        let totalBrightness = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          // Perceived brightness (0–255)
          totalBrightness += r * 0.299 + g * 0.587 + b * 0.114
          // Quantize RGB to 8 buckets per channel → max 512 buckets
          buckets.add((Math.floor(r / 32) << 6) | (Math.floor(g / 32) << 3) | Math.floor(b / 32))
        }

        const avgBrightness = totalBrightness / (size * size)
        const colorCount = buckets.size

        // Reject if too dark (< 40) or too monotone (< 20 distinct color buckets)
        resolve(avgBrightness >= 40 && colorCount >= 20)
      } catch {
        resolve(true) // if canvas fails (CORS etc), keep the photo
      }
    }
    img.onerror = () => resolve(true)
    // Analyze a tiny thumbnail to keep it fast
    img.src = url.replace('w=1920', 'w=50').replace('q=80', 'q=20')
  })
}

export function BackgroundSlideshow({ photos, intervalMs = 7000 }: Props) {
  const [bottom, setBottom] = useState<string>('')
  const [top, setTop] = useState<string | null>(null)
  const [topVisible, setTopVisible] = useState(false)

  const bottomRef = useRef('')
  const poolRef = useRef<string[]>(photos)
  const transitionActiveRef = useRef(false)
  const promoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>

    // Analyze all photos in parallel, build a filtered pool
    Promise.all(photos.map(url => analyzePhoto(url).then(ok => ok ? url : null)))
      .then(results => {
        const filtered = results.filter(Boolean) as string[]
        poolRef.current = filtered.length >= 3 ? filtered : photos

        const first = pick(poolRef.current)
        preload(first).then(() => {
          setBottom(first)
          bottomRef.current = first
          preload(pick(poolRef.current, first))
        })

        const runTransition = async () => {
          if (transitionActiveRef.current) return
          const pool = poolRef.current
          if (pool.length < 2) return

          transitionActiveRef.current = true
          const next = pick(pool, bottomRef.current)
          await preload(next)

          if (promoteTimerRef.current) clearTimeout(promoteTimerRef.current)

          setTop(next)
          setTopVisible(false)
          requestAnimationFrame(() => requestAnimationFrame(() => setTopVisible(true)))

          promoteTimerRef.current = setTimeout(() => {
            setBottom(next)
            bottomRef.current = next
            setTop(null)
            setTopVisible(false)
            transitionActiveRef.current = false
            preload(pick(pool, next))
            promoteTimerRef.current = null
          }, 2600)
        }

        intervalId = setInterval(runTransition, intervalMs)
      })

    return () => {
      clearInterval(intervalId)
      if (promoteTimerRef.current) clearTimeout(promoteTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Bottom layer — always fully visible */}
      {bottom && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bottom})` }}
        />
      )}
      {/* Top layer — fades in, then promoted to bottom */}
      {top && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${top})`,
            opacity: topVisible ? 1 : 0,
            transition: 'opacity 2.5s ease-in-out',
          }}
        />
      )}
    </div>
  )
}
