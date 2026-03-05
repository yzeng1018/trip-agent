'use client'

import { useEffect, useRef, useState } from 'react'

interface Props { photos: string[]; intervalMs?: number }

// Keep image refs alive so browser doesn't evict them from memory cache
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

export function BackgroundSlideshow({ photos, intervalMs = 7000 }: Props) {
  // bottom: always opacity-1, never fades out → no black gap ever
  const [bottom, setBottom] = useState(photos[0])
  // top: fades in on top of bottom, then becomes the new bottom
  const [top, setTop] = useState<string | null>(null)
  const [topVisible, setTopVisible] = useState(false)

  const bottomRef = useRef(photos[0])

  useEffect(() => {
    // Kick off with a random first image
    const first = pick(photos)
    preload(first).then(() => {
      setBottom(first)
      bottomRef.current = first
      preload(pick(photos, first)) // warm up next
    })

    const timer = setInterval(async () => {
      const next = pick(photos, bottomRef.current)
      await preload(next)

      // Place new image on top at opacity 0
      setTop(next)
      setTopVisible(false)

      // Two rAF ticks to ensure the element is painted before transition starts
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTopVisible(true))
      )

      // After fade-in completes: promote top → bottom, hide top layer
      setTimeout(() => {
        setBottom(next)
        bottomRef.current = next
        setTop(null)
        setTopVisible(false)
        preload(pick(photos, next)) // warm up next-next
      }, 2600) // slightly longer than the 2.5s CSS transition
    }, intervalMs)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Bottom layer — always fully visible, never fades */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bottom})` }}
      />
      {/* Top layer — fades in over the bottom */}
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
