'use client'

import { useState, useEffect, useRef } from 'react'

interface Slide {
  url: string
  kb: number   // 0-3, which Ken Burns variant
  key: number  // forces animation restart via React key
}

interface Props {
  photos: string[]
  intervalMs?: number
}

function pickNext(photos: string[], excludeUrl: string): Slide {
  const pool = photos.filter(p => p !== excludeUrl)
  const url = pool[Math.floor(Math.random() * pool.length)]
  return { url, kb: Math.floor(Math.random() * 4), key: Math.random() }
}

function preload(url: string) {
  const img = new Image()
  img.src = url
}

export function BackgroundSlideshow({ photos, intervalMs = 14000 }: Props) {
  const [current, setCurrent] = useState<Slide>(() => ({
    url: photos[Math.floor(Math.random() * photos.length)],
    kb: Math.floor(Math.random() * 4),
    key: 0,
  }))

  // opacity of current slide: 1 = fully visible, 0 = fading out
  const [opacity, setOpacity] = useState(1)
  const nextSlide = useRef<Slide>(pickNext(photos, current.url))

  useEffect(() => {
    preload(nextSlide.current.url)

    const timer = setInterval(() => {
      const incoming = nextSlide.current

      // 1. fade out current (2s)
      setOpacity(0)

      setTimeout(() => {
        // 2. swap to next, fade in (2s)
        setCurrent(incoming)
        setOpacity(1)

        // 3. prepare the one after
        const upcoming = pickNext(photos, incoming.url)
        nextSlide.current = upcoming
        preload(upcoming.url)
      }, 2000)
    }, intervalMs)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div
        key={current.key}
        className={`absolute inset-0 bg-cover bg-center kb-${current.kb}`}
        style={{
          backgroundImage: `url(${current.url})`,
          opacity,
          transition: 'opacity 2s ease-in-out',
          '--kb-duration': `${intervalMs}ms`,
        } as React.CSSProperties}
      />
    </div>
  )
}
