'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { TabiLogo } from '@/components/TabiLogo'
import { ItineraryDay } from '@/components/ItineraryDay'
import { ShareModal } from '@/components/ShareModal'
import { jsonrepair } from 'jsonrepair'
import { TripPlan, DayPlan, BookingPlan } from '@/lib/types'
import { BookingView } from '@/components/BookingView'

// ── JSON sanitizer ───────────────────────────────────────────────

/** Escape literal control characters inside JSON strings (AI sometimes emits raw \n in strings). */
function sanitizeJson(json: string): string {
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < json.length; i++) {
    const c = json[i]
    const code = json.charCodeAt(i)
    if (escaped) { result += c; escaped = false; continue }
    if (c === '\\' && inString) { result += c; escaped = true; continue }
    if (c === '"') { inString = !inString; result += c; continue }
    if (inString && code < 0x20) {
      if (c === '\n') result += '\\n'
      else if (c === '\r') result += '\\r'
      else if (c === '\t') result += '\\t'
      else result += `\\u${code.toString(16).padStart(4, '0')}`
      continue
    }
    result += c
  }
  return result
}

// ── Partial JSON extraction utils ────────────────────────────────

/** Extract a complete JSON object starting at `start`, handling nested braces and strings. */
function tryExtractObject(str: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < str.length; i++) {
    const c = str[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\' && inString) { escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return str.slice(start, i + 1) }
  }
  return null
}

/** Extract all completed DayPlan objects from a partial JSON buffer. */
function extractCompletedDays(buffer: string): DayPlan[] {
  const days: DayPlan[] = []
  const re = /"day"\s*:\s*\d+/g
  let match
  while ((match = re.exec(buffer)) !== null) {
    let start = match.index
    // Walk back to the opening { of this day object (must be followed by a quote — real JSON key)
    while (start >= 0 && !(buffer[start] === '{' && /[\s"]/.test(buffer[start + 1] ?? ''))) start--
    if (start < 0) continue
    const objStr = tryExtractObject(buffer, start)
    if (objStr) {
      try {
        const parsed = JSON.parse(jsonrepair(objStr)) as DayPlan
        // Must have activities array to be a valid day (not just a nested object)
        if (parsed.day && Array.isArray(parsed.activities)) days.push(parsed)
      } catch { /* incomplete */ }
    }
  }
  // Deduplicate by day number
  return days.filter((d, i, arr) => arr.findIndex(x => x.day === d.day) === i)
}

function extractString(buffer: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  const m = buffer.match(re)
  return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : null
}

function extractNumber(buffer: string, key: string): number | null {
  const re = new RegExp(`"${key}"\\s*:\\s*(\\d+)`)
  const m = buffer.match(re)
  return m ? parseInt(m[1]) : null
}

// ── Skeleton components ──────────────────────────────────────────

function DayLoadingSkeleton({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="mb-4 bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-400">{dayNumber}</span>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-gray-100 rounded w-16 mb-1.5" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
      </div>
      <div className="space-y-3 pl-11">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded" style={{ width: `${55 + i * 10}%` }} />
              <div className="h-3 bg-gray-100 rounded" style={{ width: `${40 + i * 8}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-full mb-1.5" />
      <div className="h-4 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-indigo-100 rounded-full w-14" />
        <div className="h-6 bg-gray-100 rounded-full w-12" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  )
}

// ── Follow-up Actions ────────────────────────────────────────────

const FOLLOW_UP_ACTIONS = [
  { label: '压缩预算', icon: '💰', prompt: '帮我重新规划，调整为更低的预算，推荐性价比更高的选择' },
  { label: '节奏放慢', icon: '🌿', prompt: '帮我重新规划，节奏轻松一些，减少每天的景点数量，多留白' },
  { label: '更多美食', icon: '🍜', prompt: '帮我重新规划，加入更多当地特色美食和餐厅推荐' },
  { label: '适合带娃', icon: '👨‍👩‍👧', prompt: '帮我重新规划，调整为适合带小孩的亲子行程' },
]

function FollowUpActions({ originalMessage }: { originalMessage: string }) {
  const router = useRouter()

  function handleAction(prompt: string) {
    const refined = `${prompt}。我的原始需求是：${originalMessage}`
    router.push(`/results?message=${encodeURIComponent(refined)}`)
  }

  return (
    <div className="mt-6 mb-2">
      <p className="text-xs text-gray-400 mb-3">想调整这份行程？</p>
      <div className="grid grid-cols-2 gap-2">
        {FOLLOW_UP_ACTIONS.map(({ label, icon, prompt }) => (
          <button
            key={label}
            onClick={() => handleAction(prompt)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 transition-all text-left"
          >
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Inline Feedback ──────────────────────────────────────────────

function InlineFeedback() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function submit() {
    if (!content.trim()) return
    setStatus('loading')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setStatus(res.ok ? 'done' : 'error')
  }

  return (
    <div className="mt-6 mb-2 rounded-2xl border border-gray-100 bg-white p-5">
      {status === 'done' ? (
        <p className="text-center text-sm text-gray-400 py-2">感谢你的反馈 ✨</p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">这份行程对你有帮助吗？</p>
          <textarea
            className="w-full h-24 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-300 resize-none outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="告诉我哪里可以改进，或者你想要的功能…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          {status === 'error' && <p className="text-xs text-red-400 mt-1.5">提交失败，请稍后再试</p>}
          <button
            onClick={submit}
            disabled={status === 'loading' || !content.trim()}
            className="mt-3 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? '提交中…' : '提交反馈'}
          </button>
        </>
      )}
    </div>
  )
}

// ── Trip confirm form ────────────────────────────────────────────

const DURATION_OPTIONS = ['3', '5', '7', '10+']
const TRAVELER_OPTIONS = ['1', '2', '3+']
const BUDGET_OPTIONS = ['不限', '5千', '1万', '2万', '5万+']
const STYLE_OPTIONS = ['🍜 美食', '📸 摄影', '🏛 文化', '🛍 购物', '🌿 自然', '👨‍👩‍👧 亲子', '💑 蜜月', '🎒 背包']

interface TripFormData {
  destination: string
  origin: string
  duration: string
  travelers: string
  budget: string
  styles: string[]
}

function TripConfirmForm({
  initialData,
  originalMessage,
  onConfirm,
}: {
  initialData: Partial<TripFormData>
  originalMessage: string
  onConfirm: (enrichedMessage: string) => void
}) {
  const [form, setForm] = useState<TripFormData>({
    destination: initialData.destination ?? '',
    origin: initialData.origin ?? '',
    duration: initialData.duration ?? '5',
    travelers: initialData.travelers ?? '1',
    budget: initialData.budget ?? '不限',
    styles: initialData.styles ?? [],
  })

  // Auto-detect origin via geolocation if not extracted from message
  useEffect(() => {
    if (form.origin) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetch(`/api/geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then(r => r.json())
          .then(data => {
            if (data.city) setForm(f => f.origin ? f : { ...f, origin: data.city })
          })
          .catch(() => {})
      },
      () => {},
      { timeout: 5000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleStyle(s: string) {
    setForm(f => ({
      ...f,
      styles: f.styles.includes(s) ? f.styles.filter(x => x !== s) : [...f.styles, s],
    }))
  }

  function handleConfirm() {
    const parts: string[] = []
    if (form.origin.trim()) parts.push(`从${form.origin.trim()}出发`)
    if (form.destination.trim()) parts.push(`去${form.destination.trim()}`)
    if (form.duration === '10+') parts.push('行程10天以上')
    else if (form.duration) parts.push(`${form.duration}天`)
    if (form.travelers !== '1') parts.push(`${form.travelers}人同行`)
    if (form.budget !== '不限') parts.push(`总预算${form.budget}`)
    if (form.styles.length > 0) {
      parts.push(`旅行风格：${form.styles.map(s => s.replace(/^\S+\s/, '')).join('、')}`)
    }
    parts.push(`用户需求：${originalMessage}`)
    onConfirm(parts.join('，'))
  }

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
      active ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-500 bg-white'
    }`
  const tagClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
      active ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 bg-white'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <TabiLogo size="sm" />
          <span className="text-sm text-gray-400">确认需求</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-1">确认你的旅行需求</h2>
        <p className="text-sm text-gray-400 mb-5">AI 已帮你填好，可以直接修改</p>

        {/* Destination + Origin */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">目的地</div>
            <input
              className="w-full text-base font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300"
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              placeholder="去哪里？"
            />
          </div>
          <div className="px-4 pt-4 pb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">出发地</div>
            <input
              className="w-full text-base font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300"
              value={form.origin}
              onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
              placeholder="从哪里出发？"
            />
          </div>
        </div>

        {/* Duration + Travelers */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="grid grid-cols-2">
            <div className="px-4 pt-4 pb-3 border-r border-gray-50">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">天数</div>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))} className={pillClass(form.duration === d)}>{d}</button>
                ))}
              </div>
            </div>
            <div className="px-4 pt-4 pb-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">人数</div>
              <div className="flex flex-wrap gap-1.5">
                {TRAVELER_OPTIONS.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, travelers: t }))} className={pillClass(form.travelers === t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="px-4 pt-4 pb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">总预算</div>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_OPTIONS.map(b => (
                <button key={b} onClick={() => setForm(f => ({ ...f, budget: b }))} className={pillClass(form.budget === b)}>{b}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Styles */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="px-4 pt-4 pb-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">旅行风格</div>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleStyle(s)} className={tagClass(form.styles.includes(s))}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 px-4 pt-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleConfirm}
            disabled={!form.destination.trim()}
            className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            开始规划
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

function Results() {
  const params = useSearchParams()
  const router = useRouter()

  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [booking, setBooking] = useState<BookingPlan | null>(null)
  const [streamDays, setStreamDays] = useState<DayPlan[]>([])
  const [streamMeta, setStreamMeta] = useState<{
    title?: string; summary?: string; destination?: string; duration?: number
  } | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamedChars, setStreamedChars] = useState(0)
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  // Form phase state
  const [phase, setPhase] = useState<'form' | 'streaming'>('form')
  const [intentData, setIntentData] = useState<Partial<TripFormData>>({})
  const [intentReady, setIntentReady] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null)

  const bufRef = useRef('')
  const daysCountRef = useRef(0)
  const metaSetRef = useRef(false)

  const message = params.get('message')
  const rawPlan = params.get('plan')

  // Intent parsing: pre-fill form from user message
  useEffect(() => {
    if (rawPlan) return // legacy path skips form
    if (!message) return

    setPhase('form')
    setIntentReady(false)
    setIntentData({})
    setConfirmedMessage(null)
    setPlan(null)
    setError('')

    let active = true
    fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: decodeURIComponent(message) }),
    })
      .then(r => r.json())
      .then(data => { if (active) { setIntentData(data); setIntentReady(true) } })
      .catch(() => { if (active) setIntentReady(true) }) // fallback: show empty form
    return () => { active = false }
  }, [message, rawPlan])

  useEffect(() => {
    // Legacy: plan already in URL
    if (rawPlan) {
      try { setPlan(JSON.parse(decodeURIComponent(rawPlan))) }
      catch { setError('数据解析失败') }
      return
    }

    if (!confirmedMessage) return

    // Reset state for this run
    bufRef.current = ''
    daysCountRef.current = 0
    metaSetRef.current = false
    setStreamedChars(0)
    setStreamDays([])
    setStreamMeta(null)
    setBooking(null)
    setPlan(null)
    setWarnings([])

    const abortController = new AbortController()
    let active = true   // guard: only update state if this effect is still current
    setStreaming(true)

    fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: confirmedMessage }),
      signal: abortController.signal,
    })
      .then(async res => {
        if (!res.ok || !res.body) {
          const text = await res.text()
          try { throw new Error(JSON.parse(text).error) } catch { throw new Error('生成失败，请重试') }
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          bufRef.current += decoder.decode(value, { stream: true })
          const buf = bufRef.current
          setStreamedChars(buf.length)

          // Extract header meta (title, summary, destination, duration)
          // Only for itinerary responses — skip if type is booking/other
          const typeMatch = buf.match(/"type"\s*:\s*"(\w+)"/)
          const detectedType = typeMatch ? typeMatch[1] : null
          if (!metaSetRef.current && detectedType !== 'booking' && detectedType !== 'other') {
            const title = extractString(buf, 'title')
            const destination = extractString(buf, 'destination')
            if (title || destination) {
              metaSetRef.current = true
              setStreamMeta({
                title: title ?? undefined,
                summary: extractString(buf, 'summary') ?? undefined,
                destination: destination ?? undefined,
                duration: extractNumber(buf, 'duration') ?? undefined,
              })
            }
          }

          // Extract completed days
          const days = extractCompletedDays(buf)
          if (days.length > daysCountRef.current) {
            daysCountRef.current = days.length
            setStreamDays([...days])
          }
        }

        // Streaming done — extract JSON object and repair
        const raw = bufRef.current
        const jsonStart = raw.search(/\{\s*"/)
        const jsonEnd = raw.lastIndexOf('}')
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('行程生成失败，请重试')
        const jsonSlice = raw.slice(jsonStart, jsonEnd + 1)

        let data
        try {
          data = JSON.parse(jsonSlice)
        } catch {
          try {
            data = JSON.parse(jsonrepair(jsonSlice))
          } catch (e2) {
            console.error('[tabi] parse failed. First 500 chars of buffer:', raw.slice(0, 500))
            console.error('[tabi] jsonrepair error:', e2)
            throw new Error('行程生成失败，请重试')
          }
        }
        if (data.type === 'other') throw new Error(data.message)
        if (data.error) throw new Error(data.error)
        if (data.type === 'booking') {
          setBooking(data)
        } else {
          setPlan(data)
          // Run checker in background — non-blocking
          if (active) {
            fetch('/api/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: confirmedMessage, plan: data }),
            })
              .then(r => r.json())
              .then(result => {
                if (active && !result.ok && result.warnings?.length) {
                  setWarnings(result.warnings)
                }
              })
              .catch(() => {}) // checker failure is silent
          }
        }
      })
      .catch(err => {
        if (!active || err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '生成失败，请重试')
      })
      .finally(() => { if (active) setStreaming(false) })

    return () => {
      active = false
      abortController.abort()
    }
  }, [confirmedMessage, rawPlan])

  // ── Form phase ──
  if (!rawPlan && phase === 'form') {
    if (!intentReady) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-100">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <TabiLogo size="sm" />
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        </div>
      )
    }
    return (
      <TripConfirmForm
        initialData={intentData}
        originalMessage={decodeURIComponent(message ?? '')}
        onConfirm={(enriched) => {
          setConfirmedMessage(enriched)
          setPhase('streaming')
        }}
      />
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
          重新规划
        </button>
      </div>
    )
  }

  // ── Booking view ──
  if (booking) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1035 0%, #0f172a 100%)' }}>
        <header className="px-4 pt-5 pb-4 flex items-center justify-between">
          <button onClick={() => router.push('/')}>
            <TabiLogo size="sm" theme="light" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            重新搜索
          </button>
        </header>
        <div className="flex-1 px-4 pb-8 flex flex-col max-w-lg mx-auto w-full">
          <p className="text-white/50 text-sm mb-6">{booking.query}</p>
          <BookingView plan={booking} />
        </div>
      </div>
    )
  }

  // ── Initial loading (stream not started yet) ──
  if (!plan && !streamMeta && !streamDays.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <TabiLogo size="sm" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ── Progressive / full render ──
  const isStreaming = streaming && !plan
  const displayDays = plan?.days ?? streamDays
  const meta = plan ?? streamMeta

  // Progress: days-based when available, otherwise char-based
  const totalDays = meta?.duration ?? 5
  const completedDays = displayDays.length
  const estimatedTotal = totalDays * 900 + 1500
  const charProgress = Math.min(88, (streamedChars / estimatedTotal) * 100)
  const dayProgress = completedDays > 0 ? Math.min(92, (completedDays / totalDays) * 95) : 0
  const rawProgress = isStreaming
    ? Math.max(charProgress, dayProgress)
    : plan ? 100 : 0
  const pct = Math.round(rawProgress)

  // Status label
  const streamLabel = completedDays > 0
    ? `正在规划第 ${completedDays + 1} 天 / 共 ${totalDays} 天`
    : streamMeta?.title
      ? '正在安排每日行程…'
      : '正在理解你的旅行需求…'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')}>
            <TabiLogo size="sm" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {meta?.destination && <span>{meta.destination}</span>}
            {meta?.destination && meta?.duration && <span>·</span>}
            {meta?.duration && <span>{meta.duration} 天</span>}
            {plan?.request.travelers && plan.request.travelers > 1 && (
              <><span>·</span><span>{plan.request.travelers} 人</span></>
            )}
          </div>
          <div className="flex items-center">
            {plan && (
              <button
                onClick={() => setShowShare(true)}
                className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                分享
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 pb-28 flex-1">
        {/* Progress bar */}
        {!plan && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{streamLabel}</span>
              <span className="text-sm font-semibold text-indigo-500 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                style={{
                  height: '100%',
                  width: `${rawProgress}%`,
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)',
                  borderRadius: 9999,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>
        )}

        {/* Trip header */}
        {meta?.title ? (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{meta.title}</h1>
            {meta.summary && <p className="text-gray-500 leading-relaxed">{meta.summary}</p>}

            {/* Tags — only available once full plan is loaded */}
            {plan && (
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
            )}
          </div>
        ) : (
          <HeaderSkeleton />
        )}

        {/* Getting there — only when plan is fully loaded */}
        {plan?.gettingThere && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {plan.gettingThere.type === 'flight' ? '✈️' : plan.gettingThere.type === 'train' ? '🚄' : '🚌'} 怎么去
            </h3>
            <p className="text-sm font-medium text-gray-900 mb-1">{plan.gettingThere.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
              <span>⏱ {plan.gettingThere.duration}</span>
              <span>·</span>
              <span>{plan.gettingThere.priceRange}</span>
            </div>
            {plan.gettingThere.tips && (
              <p className="text-xs text-indigo-500 mt-2">{plan.gettingThere.tips}</p>
            )}
            {plan.gettingAround && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1 font-medium">当地出行</p>
                <p className="text-sm text-gray-600">{plan.gettingAround}</p>
              </div>
            )}
          </div>
        )}

        {/* Days — rendered as they arrive */}
        {displayDays.map(day => (
          <ItineraryDay key={day.day} day={day} />
        ))}

        {/* Skeleton for the day currently being generated */}
        {isStreaming && (
          <DayLoadingSkeleton dayNumber={displayDays.length + 1} />
        )}

        {/* Checker warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-orange-800 mb-3">⚠️ 行程提醒</h3>
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Practical tips — only when fully done */}
        {(plan?.practicalTips?.length ?? 0) > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-900 mb-3">出行贴士</h3>
            <ul className="space-y-2">
              {plan?.practicalTips?.map((tip, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hotel recommendation */}
        {plan?.hotel && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">🏨 推荐住宿</h3>
            <p className="text-base font-semibold text-gray-900">{plan.hotel.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">{plan.hotel.area} · {plan.hotel.pricePerNight}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {plan.hotel.highlights.map((h, i) => (
                <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">{h}</span>
              ))}
            </div>
            {plan.hotel.tips && (
              <p className="text-xs text-gray-400">{plan.hotel.tips}</p>
            )}
          </div>
        )}

        {/* Follow-up actions — only when plan is fully loaded */}
        {plan && <FollowUpActions originalMessage={confirmedMessage ?? decodeURIComponent(message ?? '')} />}

        {/* Inline feedback — only when plan is fully loaded */}
        {plan && <InlineFeedback />}
      </main>

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            重新规划
          </button>
        </div>
      </div>

      {showShare && plan && (
        <ShareModal plan={plan} onClose={() => setShowShare(false)} />
      )}
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
