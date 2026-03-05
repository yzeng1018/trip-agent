'use client'

import { useState } from 'react'
import { BookingPlan, FlightOption, HotelOption, TicketOption } from '@/lib/types'

type Section = 'flights' | 'hotels' | 'tickets'

const SECTION_LABELS: Record<Section, string> = {
  flights: '机票',
  hotels: '酒店',
  tickets: '景点门票',
}

const SECTION_ICONS: Record<Section, string> = {
  flights: '✈️',
  hotels: '🏨',
  tickets: '🎫',
}

function FlightCard({ item }: { item: FlightOption }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{item.airline}</p>
          <p className="text-xs text-gray-300 mt-0.5">{item.flightNo}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{item.priceRange}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.stops === 0 ? '直飞' : `经停${item.stops}次`}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{item.departTime}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400">{item.duration}</p>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-white/20" />
            <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <div className="flex-1 h-px bg-white/20" />
          </div>
          <p className="text-xs text-gray-400">{item.route}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{item.arriveTime}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.highlights.map((h, i) => (
          <span key={i} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full">{h}</span>
        ))}
      </div>

      {item.tips && (
        <p className="text-sm text-indigo-300 bg-indigo-500/10 rounded-xl px-4 py-3">{item.tips}</p>
      )}
    </div>
  )
}

function HotelCard({ item }: { item: HotelOption }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-white">{item.name}</p>
          <p className="text-sm text-gray-400 mt-1">{item.area} · {'★'.repeat(Math.max(0, Math.min(5, item.stars || 0)))}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{item.pricePerNight}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.highlights.map((h, i) => (
          <span key={i} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full">{h}</span>
        ))}
      </div>

      {item.tips && (
        <p className="text-sm text-indigo-300 bg-indigo-500/10 rounded-xl px-4 py-3">{item.tips}</p>
      )}
    </div>
  )
}

function TicketCard({ item }: { item: TicketOption }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-white">{item.attraction}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{item.priceRange}</p>
          <p className="text-xs text-gray-400 mt-0.5">每人</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.highlights.map((h, i) => (
          <span key={i} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full">{h}</span>
        ))}
      </div>

      {item.tips && (
        <p className="text-sm text-indigo-300 bg-indigo-500/10 rounded-xl px-4 py-3">{item.tips}</p>
      )}
    </div>
  )
}

export function BookingView({ plan }: { plan: BookingPlan }) {
  const availableSections = (
    ['flights', 'hotels', 'tickets'] as Section[]
  ).filter(s => plan[s].length > 0)

  const [section, setSection] = useState<Section>(availableSections[0] ?? 'flights')
  const [indices, setIndices] = useState<Record<Section, number>>({ flights: 0, hotels: 0, tickets: 0 })
  const [animating, setAnimating] = useState(false)

  const items = plan[section]
  const idx = indices[section]
  const currentItem = items[idx]
  const hasNext = idx < items.length - 1

  function goNext() {
    if (!hasNext || animating) return
    setAnimating(true)
    setTimeout(() => {
      setIndices(prev => ({ ...prev, [section]: prev[section] + 1 }))
      setAnimating(false)
    }, 250)
  }

  function getBookingUrl() {
    if (section === 'flights') return (currentItem as FlightOption).bookingUrl || '#'
    if (section === 'hotels') return (currentItem as HotelOption).bookingUrl || '#'
    return (currentItem as TicketOption).bookingUrl || '#'
  }

  if (availableSections.length === 0) {
    return <p className="text-white/50 text-sm text-center py-12">暂无推荐方案</p>
  }

  if (!currentItem) return null

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        {availableSections.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              section === s
                ? 'bg-white text-gray-900'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <span>{SECTION_ICONS[s]}</span>
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="flex-1 bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(-12px)' : 'translateY(0)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {section === 'flights' && <FlightCard item={currentItem as FlightOption} />}
        {section === 'hotels' && <HotelCard item={currentItem as HotelOption} />}
        {section === 'tickets' && <TicketCard item={currentItem as TicketOption} />}
      </div>

      {/* Counter */}
      <div className="flex justify-center gap-1.5 mt-4 mb-4">
        {items.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {hasNext && (
          <button
            onClick={goNext}
            className="flex-1 py-3.5 rounded-2xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            换一个
          </button>
        )}
        <a
          href={getBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-semibold text-center hover:bg-white/90 transition-all"
        >
          去预订
        </a>
      </div>
    </div>
  )
}
