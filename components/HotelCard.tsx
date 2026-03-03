'use client'

import { Hotel } from '@/lib/types'

export function HotelCard({ hotel, nights = 1 }: { hotel: Hotel; nights?: number }) {
  const total = hotel.pricePerNight * nights

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-36 bg-gray-100 relative">
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-gray-700">
          {'★'.repeat(hotel.stars)}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{hotel.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">📍 {hotel.location} · {hotel.distanceToCenter}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            {hotel.rating}
          </span>
          <span className="text-xs text-gray-500">{hotel.reviewCount.toLocaleString()} 条评价</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
              {a}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-lg font-bold text-blue-600">¥{hotel.pricePerNight.toLocaleString()}</p>
            <p className="text-xs text-gray-400">/晚 · 共 ¥{total.toLocaleString()}</p>
          </div>
          <button
            onClick={() => hotel.bookingUrl && window.open(hotel.bookingUrl, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            预订
          </button>
        </div>
      </div>
    </div>
  )
}
