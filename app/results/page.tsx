'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { TabiLogo } from '@/components/TabiLogo'
import { ItineraryDay } from '@/components/ItineraryDay'
import { TripPlan } from '@/lib/types'

function Results() {
  const params = useSearchParams()
  const router = useRouter()

  let plan: TripPlan | null = null
  try {
    const raw = params.get('plan')
    if (raw) plan = JSON.parse(decodeURIComponent(raw))
  } catch {
    return <p className="text-center text-red-500 mt-20">数据解析失败</p>
  }

  if (!plan) return <p className="text-center text-gray-400 mt-20">暂无数据</p>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')}>
            <TabiLogo size="sm" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{plan.destination}</span>
            <span>·</span>
            <span>{plan.duration} 天</span>
            {plan.request.travelers > 1 && (
              <>
                <span>·</span>
                <span>{plan.request.travelers} 人</span>
              </>
            )}
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            重新规划
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {/* Trip header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h1>
          <p className="text-gray-500 leading-relaxed">{plan.summary}</p>

          {/* Meta tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {plan.request.style && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                {plan.request.style}
              </span>
            )}
            {plan.request.interests?.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {plan.estimatedBudget && (
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                💰 {plan.estimatedBudget}
              </span>
            )}
          </div>
        </div>

        {/* Day by day */}
        {plan.days.map(day => (
          <ItineraryDay key={day.day} day={day} />
        ))}

        {/* Practical tips */}
        {plan.practicalTips?.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-900 mb-3">出行贴士</h3>
            <ul className="space-y-2">
              {plan.practicalTips.map((tip, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">正在生成行程...</p>
        </div>
      </div>
    }>
      <Results />
    </Suspense>
  )
}
