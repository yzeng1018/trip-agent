'use client'

import { FlightOption, HotelOption, TicketOption, TripFormData } from '@/lib/types'
import { getPlatformName } from '@/lib/booking'

interface BookingConfirmModalProps {
  open: boolean
  onClose: () => void
  item: FlightOption | HotelOption | TicketOption
  type: 'flight' | 'hotel' | 'ticket'
  intent: Partial<TripFormData>
  bookingUrl: string
}

function BookingSummary({
  item,
  type,
  intent,
}: {
  item: FlightOption | HotelOption | TicketOption
  type: 'flight' | 'hotel' | 'ticket'
  intent: Partial<TripFormData>
}) {
  const travelers = intent.travelers === '3+' ? '3人以上' : `${intent.travelers ?? 1}人`

  if (type === 'flight') {
    const f = item as FlightOption
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-white">
          <span className="text-2xl">✈</span>
          <span className="text-lg font-bold">{f.route}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white/70">
          {f.airline && <span>{f.airline}</span>}
          {f.departTime && f.arriveTime && (
            <span>{f.departTime} → {f.arriveTime}</span>
          )}
          <span>{travelers}</span>
          {intent.departDate && <span>{intent.departDate}</span>}
        </div>
        <div className="text-2xl font-bold text-white">{f.priceRange}</div>
      </div>
    )
  }

  if (type === 'hotel') {
    const h = item as HotelOption
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-white">
          <span className="text-2xl">🏨</span>
          <div>
            <p className="text-lg font-bold">{h.name}</p>
            <p className="text-sm text-white/60">{h.area}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white/70">
          <span>{travelers}</span>
          {intent.departDate && <span>入住 {intent.departDate}</span>}
          {intent.duration && intent.duration !== '10+' && <span>住 {intent.duration} 晚</span>}
        </div>
        <div className="text-2xl font-bold text-white">{h.pricePerNight}</div>
      </div>
    )
  }

  // ticket
  const t = item as TicketOption
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-white">
        <span className="text-2xl">🎫</span>
        <span className="text-lg font-bold">{t.attraction}</span>
      </div>
      <div className="text-sm text-white/70">{travelers}</div>
      <div className="text-2xl font-bold text-white">{t.priceRange}</div>
    </div>
  )
}

export function BookingConfirmModal({
  open,
  onClose,
  item,
  type,
  intent,
  bookingUrl,
}: BookingConfirmModalProps) {
  if (!open) return null

  const platform = getPlatformName(bookingUrl)

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl p-6 pb-10 flex flex-col gap-6"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

        <div>
          <p className="text-xs text-white/40 mb-4 uppercase tracking-wider">确认预订信息</p>
          <BookingSummary item={item} type={type} intent={intent} />
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-2xl bg-white text-gray-900 text-sm font-semibold text-center hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            前往 {platform} 预订
          </a>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
          >
            返回修改
          </button>
        </div>
      </div>
    </div>
  )
}
