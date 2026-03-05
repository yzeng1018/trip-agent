'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { TabiLogo } from '@/components/TabiLogo'
import { ItineraryDay } from '@/components/ItineraryDay'
import { ShareModal } from '@/components/ShareModal'
import { jsonrepair } from 'jsonrepair'
import { TripPlan, DayPlan } from '@/lib/types'

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

// ── Main component ───────────────────────────────────────────────

function Results() {
  const params = useSearchParams()
  const router = useRouter()

  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [streamDays, setStreamDays] = useState<DayPlan[]>([])
  const [streamMeta, setStreamMeta] = useState<{
    title?: string; summary?: string; destination?: string; duration?: number
  } | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamedChars, setStreamedChars] = useState(0)
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bufRef = useRef('')
  const daysCountRef = useRef(0)
  const metaSetRef = useRef(false)

  const message = params.get('message')
  const rawPlan = params.get('plan')

  useEffect(() => {
    // Legacy: plan already in URL
    if (rawPlan) {
      try { setPlan(JSON.parse(decodeURIComponent(rawPlan))) }
      catch { setError('数据解析失败') }
      return
    }

    if (!message) { setError('暂无数据'); return }

    // Reset state for this run
    bufRef.current = ''
    daysCountRef.current = 0
    metaSetRef.current = false
    setStreamedChars(0)
    setStreamDays([])
    setStreamMeta(null)

    const abortController = new AbortController()
    let active = true   // guard: only update state if this effect is still current
    setStreaming(true)

    fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: decodeURIComponent(message) }),
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
          if (!metaSetRef.current) {
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
        if (data.error) throw new Error(data.error)
        setPlan(data)
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
  }, [message, rawPlan])

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
          <div className="flex items-center gap-2">
            {plan && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                    </svg>
                  )}
                  {copied ? '已复制' : '复制链接'}
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  分享
                </button>
                <span className="text-gray-200">|</span>
              </>
            )}
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              重新规划
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
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

        {/* Days — rendered as they arrive */}
        {displayDays.map(day => (
          <ItineraryDay key={day.day} day={day} />
        ))}

        {/* Skeleton for the day currently being generated */}
        {isStreaming && (
          <DayLoadingSkeleton dayNumber={displayDays.length + 1} />
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
      </main>

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
