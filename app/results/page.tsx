'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { FlightCard } from '@/components/FlightCard'
import { HotelCard } from '@/components/HotelCard'
import { ParsedIntent } from '@/components/ParsedIntent'
import { SearchResults } from '@/lib/types'

function Results() {
  const params = useSearchParams()
  const router = useRouter()

  let data: SearchResults | null = null
  try {
    const raw = params.get('data')
    if (raw) data = JSON.parse(decodeURIComponent(raw))
  } catch {
    return <p className="text-center text-red-500 mt-20">数据解析失败</p>
  }

  if (!data) return <p className="text-center text-gray-400 mt-20">暂无数据</p>

  const { intent, flights, returnFlights, hotels } = data
  const nights = intent.returnDate
    ? Math.max(1, Math.round((new Date(intent.returnDate).getTime() - new Date(intent.departDate).getTime()) / 86400000))
    : 7

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            ← 重新搜索
          </button>
          <div className="flex-1">
            <ParsedIntent intent={intent} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Outbound Flights */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              去程机票
              <span className="ml-2 text-sm font-normal text-gray-400">{flights.length} 个结果</span>
            </h2>
          </div>
          {flights.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无符合条件的机票</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flights.map(f => (
                <FlightCard key={f.id} flight={f} passengers={intent.passengers} />
              ))}
            </div>
          )}
        </section>

        {/* Return Flights */}
        {returnFlights && returnFlights.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              回程机票
              <span className="ml-2 text-sm font-normal text-gray-400">{returnFlights.length} 个结果</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {returnFlights.map(f => (
                <FlightCard key={f.id + '-r'} flight={f} passengers={intent.passengers} />
              ))}
            </div>
          </section>
        )}

        {/* Hotels */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            推荐酒店
            <span className="ml-2 text-sm font-normal text-gray-400">
              {hotels.length} 个结果 · {nights} 晚
            </span>
          </h2>
          {hotels.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无符合条件的酒店</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map(h => (
                <HotelCard key={h.id} hotel={h} nights={nights} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-gray-400">加载中...</div>}>
      <Results />
    </Suspense>
  )
}
