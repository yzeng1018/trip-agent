'use client'

import { useState, useEffect, useRef } from 'react'

interface Slide { url: string; kb: number }
interface Props { photos: string[]; intervalMs?: number }

function pick(photos: string[], exclude: string): Slide {
  const pool = photos.filter(p => p !== exclude)
  const url = pool[Math.floor(Math.random() * pool.length)]
  return { url, kb: Math.floor(Math.random() * 4) }
}

function preload(url: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

export function BackgroundSlideshow({ photos, intervalMs = 14000 }: Props) {
  // Two fixed slots that alternate — slot A and slot B
  const [slides, setSlides] = useState<[Slide, Slide]>([
    { url: photos[0], kb: 0 },
    { url: photos[0], kb: 0 },
  ])
  const [active, setActive] = useState<0 | 1>(0)
  const [ready, setReady] = useState(false)
  const activeRef = useRef<0 | 1>(0)
  const nextRef = useRef<Slide>({ url: photos[0], kb: 0 })

  useEffect(() => {
    const first: Slide = {
      url: photos[Math.floor(Math.random() * photos.length)],
      kb: Math.floor(Math.random() * 4),
    }

    // Wait for first image before showing anything — eliminates initial black screen
    preload(first.url).then(() => {
      const second = pick(photos, first.url)
      // slot 0 = first (active), slot 1 = second (ready underneath at opacity 0)
      setSlides([first, second])
      setActive(0)
      activeRef.current = 0
      setReady(true)

      nextRef.current = pick(photos, second.url)
      preload(second.url)
      preload(nextRef.current.url)
    })

    const timer = setInterval(() => {
      const incoming = nextRef.current
      const nextActive = (activeRef.current === 0 ? 1 : 0) as 0 | 1

      // Step 1: load incoming URL into the inactive slot (still opacity 0, invisible)
      setSlides(prev => {
        const next = [...prev] as [Slide, Slide]
        next[nextActive] = incoming
        return next
      })

      // Step 2: one frame later, flip active — browser transitions opacity 0→1
      requestAnimationFrame(() => {
        setActive(nextActive)
        activeRef.current = nextActive
      })

      // Prepare next
      const upcoming = pick(photos, incoming.url)
      nextRef.current = upcoming
      preload(upcoming.url)
    }, intervalMs)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.5s ease-in-out' }}
    >
      {([0, 1] as const).map(slot => (
        <div
          key={slot}
          className={`absolute inset-0 bg-cover bg-center kb-${slides[slot].kb}`}
          style={{
            backgroundImage: `url(${slides[slot].url})`,
            opacity: active === slot ? 1 : 0,
            transition: 'opacity 2s ease-in-out',
            '--kb-duration': `${intervalMs}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
