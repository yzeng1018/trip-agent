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

    function startSlideshow(pool: string[]) {
      poolRef.current = pool
      const first = pick(pool)
      preload(first).then(() => {
        setBottom(first)
        bottomRef.current = first
        preload(pick(pool, first))
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
    }

    // Fetch server-filtered photo list (server-side analysis avoids CORS issues)
    fetch('/api/filter-photos')
      .then(r => r.json())
      .then(({ photos: good }) => startSlideshow(good))
      .catch(() => startSlideshow(photos)) // fallback to original list

    return () => {
      clearInterval(intervalId)
      if (promoteTimerRef.current) clearTimeout(promoteTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {bottom && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bottom})` }}
        />
      )}
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
