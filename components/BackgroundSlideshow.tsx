'use client'

import { useState, useEffect, useRef } from 'react'

interface Slide {
  url: string
  kb: number
  key: number
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
  // bottom layer: incoming slide (always fully visible underneath)
  const [bottom, setBottom] = useState<Slide>({ url: photos[0], kb: 0, key: 0 })
  // top layer: current slide, fades out to reveal bottom
  const [top, setTop] = useState<Slide>({ url: photos[0], kb: 0, key: 1 })
  const [topOpacity, setTopOpacity] = useState(1)
  const nextSlide = useRef<Slide>({ url: photos[1] ?? photos[0], kb: 0, key: 2 })

  useEffect(() => {
    const initialSlide: Slide = {
      url: photos[Math.floor(Math.random() * photos.length)],
      kb: Math.floor(Math.random() * 4),
      key: 0,
    }
    setBottom(initialSlide)
    setTop(initialSlide)
    setTopOpacity(1)
    nextSlide.current = pickNext(photos, initialSlide.url)
    preload(nextSlide.current.url)

    const timer = setInterval(() => {
      const incoming = nextSlide.current

      // 1. place incoming on bottom layer (invisible behind top)
      setBottom(incoming)

      // 2. fade out top layer to reveal incoming underneath
      setTopOpacity(0)

      setTimeout(() => {
        // 3. snap top layer to incoming (now invisible, no flicker)
        //    then restore opacity so it's ready for next transition
        setTop(incoming)
        setTopOpacity(1)

        // 4. prepare next
        const upcoming = pickNext(photos, incoming.url)
        nextSlide.current = upcoming
        preload(upcoming.url)
      }, 2200)
    }, intervalMs)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Bottom layer: next slide, always fully visible */}
      <div
        key={`b-${bottom.key}`}
        className={`absolute inset-0 bg-cover bg-center kb-${bottom.kb}`}
        style={{
          backgroundImage: `url(${bottom.url})`,
          '--kb-duration': `${intervalMs}ms`,
        } as React.CSSProperties}
      />
      {/* Top layer: current slide, fades out during transition */}
      <div
        key={`t-${top.key}`}
        className={`absolute inset-0 bg-cover bg-center kb-${top.kb}`}
        style={{
          backgroundImage: `url(${top.url})`,
          opacity: topOpacity,
          transition: topOpacity === 0 ? 'opacity 2s ease-in-out' : 'none',
          '--kb-duration': `${intervalMs}ms`,
        } as React.CSSProperties}
      />
    </div>
  )
}
