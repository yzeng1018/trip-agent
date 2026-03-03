'use client'

import { Flight } from '@/lib/types'

const airlineLogo: Record<string, string> = {
  CA: '🇨🇳', AF: '🇫🇷', KL: '🇳🇱', QR: '🇶🇦', LH: '🇩🇪',
}

export function FlightCard({ flight, passengers = 1 }: { flight: Flight; passengers?: number }) {
  const total = flight.price * passengers

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{airlineLogo[flight.airlineCode] ?? '✈️'}</span>
          <div>
            <p className="font-semibold text-gray-900">{flight.airline}</p>
            <p className="text-xs text-gray-400">{flight.flightNumber} · {flight.cabinClass}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">¥{flight.price.toLocaleString()}</p>
          <p className="text-xs text-gray-400">/人 · 共 ¥{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{flight.departTime}</p>
          <p className="text-xs text-gray-500">{flight.from}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-1">{flight.duration}</p>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-gray-300 text-xs">✈</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {flight.stops === 0 ? '直飞' : `经停 ${flight.stops} 次`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{flight.arriveTime}</p>
          <p className="text-xs text-gray-500">{flight.to}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-orange-500 font-medium">
          {flight.seatsLeft <= 5 ? `仅剩 ${flight.seatsLeft} 席` : '余票充足'}
        </span>
        <button
          onClick={() => flight.bookingUrl && window.open(flight.bookingUrl, '_blank')}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          选择
        </button>
      </div>
    </div>
  )
}
