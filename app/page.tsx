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

      {/* Overlay — gradient for better depth */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 40%, rgba(15,5,40,0.72) 100%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-[2] px-6 pt-6 flex items-center justify-between">
        <TabiLogo size="md" theme="light" />
      </nav>

      {/* Hero */}
      <div className="relative z-[2] flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-5 sm:px-6 pb-6 sm:pb-24">
        <div className="mb-7 sm:mb-9">
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-2.5 leading-tight tracking-tight"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.3)' }}
          >
            你想去哪里？
          </h1>
          <p
            className="text-base sm:text-lg text-white/70 leading-relaxed"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.25)' }}
          >
            告诉我你的出行风格和预算，我来帮你规划旅程。
          </p>
        </div>

        {/* Input card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-0.5"
            style={{
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            }}
          />

          <div className="px-5 pt-4 pb-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSearch()
                }
              }}
              placeholder="设计一次难忘的樱花季日本之旅，4月中旬，两个人..."
              className="w-full resize-none text-slate-800 text-base leading-relaxed placeholder-slate-300 outline-none min-h-[60px] sm:min-h-[80px] bg-transparent"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end px-4 pb-4">
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-full disabled:opacity-35 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : '#e2e8f0',
                boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => setInput(action.prompt)}
              className="px-4 py-2 rounded-full text-sm text-white border border-white/20 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all cursor-pointer"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
