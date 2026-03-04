'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { TabiLogo } from '@/components/TabiLogo'
import { ItineraryDay } from '@/components/ItineraryDay'
import { TripPlan } from '@/lib/types'

const LOADING_STEPS = [
  '正在理解你的旅行需求...',
  '规划最佳路线和景点...',
  '安排每天的详细行程...',
  '添加实用贴士和预算建议...',
  '即将完成，稍等片刻...',
]

function LoadingScreen({ message }: { message: string }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(dotTimer)
  }, [])

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, LOADING_STEPS.length - 1))
    }, 5000)
    return () => clearInterval(stepTimer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <TabiLogo size="sm" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">✈️</div>
        </div>

        {/* User message */}
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 mb-6 text-sm text-gray-600 leading-relaxed">
          {message}
        </div>

        {/* Status steps */}
        <div className="max-w-sm w-full space-y-2">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i < stepIndex ? 'text-indigo-500' :
                i === stepIndex ? 'text-gray-800 font-medium' :
                'text-gray-300'
              }`}
            >
              <span className="w-4 h-4 flex-shrink-0">
                {i < stepIndex ? (
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <circle cx="8" cy="8" r="7" fill="#EEF2FF" />
                    <path d="M5 8l2 2 4-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === stepIndex ? (
                  <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mt-1 animate-pulse" />
                ) : (
                  <span className="inline-block w-2 h-2 bg-gray-200 rounded-full mt-1" />
                )}
              </span>
              <span>{i === stepIndex ? `${step.replace('...', '')}${dots}` : step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Results() {
  const params = useSearchParams()
  const router = useRouter()
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [error, setError] = useState('')

  const message = params.get('message')
  const rawPlan = params.get('plan')

  useEffect(() => {
    // Legacy: plan already in URL
    if (rawPlan) {
      try {
        setPlan(JSON.parse(decodeURIComponent(rawPlan)))
      } catch {
        setError('数据解析失败')
      }
      return
    }

    // New flow: fetch from API
    if (!message) {
      setError('暂无数据')
      return
    }

    fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: decodeURIComponent(message) }),
    })
      .then(async res => {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          if (data.error) throw new Error(data.error)
          setPlan(data.plan)
        } catch {
          throw new Error('生成失败，请重试')
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : '生成失败，请重试'))
  }, [message, rawPlan])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm"
        >
          重新规划
        </button>
      </div>
    )
  }

  if (!plan) {
    return <LoadingScreen message={message ? decodeURIComponent(message) : '正在生成行程...'} />
  }

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
        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <Results />
    </Suspense>
  )
}
