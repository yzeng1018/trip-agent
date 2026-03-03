'use client'

import { TravelIntent } from '@/lib/types'

export function ParsedIntent({ intent }: { intent: TravelIntent }) {
  const tags = [
    intent.from && intent.to && `${intent.from} → ${intent.to}`,
    intent.departDate && `去程 ${intent.departDate}`,
    intent.returnDate && `回程 ${intent.returnDate}`,
    intent.passengers && `${intent.passengers} 人`,
    intent.airlines?.length && intent.airlines.join(' / '),
    intent.maxBudget && `机票预算 ¥${intent.maxBudget.toLocaleString()}/人`,
    intent.hotelStars && `${intent.hotelStars}星及以上`,
    intent.hotelLocation && intent.hotelLocation,
  ].filter(Boolean)

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
        >
          {tag as string}
        </span>
      ))}
    </div>
  )
}
