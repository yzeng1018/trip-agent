'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TabiLogo } from '@/components/TabiLogo'
import { BackgroundSlideshow } from '@/components/BackgroundSlideshow'
import { TRAVEL_PHOTOS } from '@/lib/photos'

const QUICK_ACTIONS = [
  { label: '🌍 给我旅行灵感', prompt: '给我推荐一个适合现在去的目的地' },
  { label: '🚗 规划公路旅行', prompt: '帮我规划一次公路旅行' },
  { label: '⚡ 随时出发', prompt: '我想马上出发，帮我找一个近期可以去的地方' },
]

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')

  async function handleSearch() {
    if (!input.trim()) return
    router.push(`/results?message=${encodeURIComponent(input)}`)
  }

  return (
    <main className="min-h-screen relative flex flex-col">
      {/* Dynamic background slideshow */}
      <BackgroundSlideshow photos={TRAVEL_PHOTOS} intervalMs={7000} />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25 z-[1]" />

      {/* Nav */}
      <nav className="relative z-[2] px-6 pt-5 flex items-center justify-between">
        <TabiLogo size="md" theme="light" />
      </nav>

      {/* Hero */}
      <div className="relative z-[2] flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 pb-24">
        <h1 className="text-5xl font-bold text-white mb-3 leading-tight tracking-tight">
          你想去哪里？
        </h1>
        <p className="text-lg text-white/75 mb-8 leading-relaxed">
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
            className="w-full resize-none text-gray-800 text-base leading-relaxed placeholder-gray-300 outline-none min-h-[80px]"
            rows={3}
          />

          <div className="flex items-center justify-between mt-4">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              附件
            </button>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={handleSearch}
                disabled={!input.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  规划行程
                </>
              </button>
            </div>
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
