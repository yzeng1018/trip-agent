'use client'

import { useEffect, useState } from 'react'

interface Props { photos: string[]; intervalMs?: number }

function pick(photos: string[], exclude?: string) {
  const pool = exclude ? photos.filter(p => p !== exclude) : photos
  return pool[Math.floor(Math.random() * pool.length)]
}

export function BackgroundSlideshow({ photos, intervalMs = 7000 }: Props) {
  const [current, setCurrent] = useState(photos[0])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => pick(photos, prev))
    }, intervalMs)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${current})` }}
    />
  )
}
