'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TabiLogo } from '@/components/TabiLogo'
import { BackgroundSlideshow } from '@/components/BackgroundSlideshow'
import { TRAVEL_PHOTOS } from '@/lib/photos'

const QUICK_ACTIONS = [
  { label: '想去巴黎', prompt: '我一直想去巴黎，7月份，一个人，10天，文艺感强一点，帮我规划一下，预算2万' },
  { label: '旅行灵感', prompt: '现在是春天，推荐一个适合两人出行的目的地，喜欢美食和文艺感，预算人均1万左右' },
  { label: '行程规划', prompt: '帮我规划5天大阪行程，4月初出发，两个人，喜欢吃喝玩乐，不想走太多路' },
  { label: '机票酒店', prompt: '从上海飞东京，4月15日出发，两个人，经济舱，顺便推荐住新宿还是浅草哪个更方便' },
]

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')

  async function handleSearch() {
    if (!input.trim()) return
    router.push(`/results?message=${encodeURIComponent(input)}`)
  }

  return (
    <main className="min-h-screen relative flex flex-col" style={{ backgroundColor: '#1a1035' }}>
      {/* Dynamic background slideshow */}
      <BackgroundSlideshow photos={TRAVEL_PHOTOS} intervalMs={7000} />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25 z-[1]" />

      {/* Nav */}
      <nav className="relative z-[2] px-6 pt-5 flex items-center justify-between">
        <TabiLogo size="md" theme="light" />
      </nav>

      {/* Hero */}
      <div className="relative z-[2] flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-4 sm:px-6 pb-6 sm:pb-24">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight tracking-tight">
          你想去哪里？
        </h1>
        <p className="text-base sm:text-lg text-white/75 mb-4 sm:mb-8 leading-relaxed">
          告诉我你的出行风格和预算，我来帮你规划旅程。
        </p>

        {/* Input card */}
        <div className="bg-white rounded-3xl shadow-2xl p-5">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
            }}
            placeholder="设计一次难忘的樱花季日本之旅，4月中旬，两个人..."
            className="w-full resize-none text-gray-800 text-base leading-relaxed placeholder-gray-300 outline-none min-h-[60px] sm:min-h-[80px]"
            rows={2}
          />

          <div className="flex items-center justify-end mt-3">
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-5">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => setInput(action.prompt)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm rounded-full hover:bg-white/30 transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>

      </div>
    </main>
  )
}
