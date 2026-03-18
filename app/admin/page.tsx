import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { TabiLogo } from '@/components/TabiLogo'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface LogRow {
  user_input: string
  duration_ms: number
  ip: string
  created_at: string
}

interface FeedbackRow {
  content: string
  created_at: string
}

interface DayStat {
  date: string        // "YYYY-MM-DD"
  requests: number
  uniqueIps: number
  avgDurationMs: number
}

// ── Data fetching ────────────────────────────────────────────────

async function fetchAdminData(excludeIp?: string) {
  const supabase = getSupabase()

  const since = new Date()
  since.setDate(since.getDate() - 13)
  since.setHours(0, 0, 0, 0)

  const [logsResult, feedbackResult] = await Promise.all([
    supabase
      .from('logs')
      .select('user_input, duration_ms, ip, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('feedback')
      .select('content, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const allLogs: LogRow[] = logsResult.data ?? []
  const feedback: FeedbackRow[] = feedbackResult.data ?? []

  // Optionally exclude test IP
  const logs = excludeIp
    ? allLogs.filter(r => r.ip !== excludeIp)
    : allLogs

  // Aggregate by date
  const byDate = new Map<string, { ips: Set<string>; durations: number[] }>()
  for (const row of logs) {
    const date = row.created_at.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, { ips: new Set(), durations: [] })
    const d = byDate.get(date)!
    d.ips.add(row.ip)
    d.durations.push(row.duration_ms)
  }

  // Build last 14 days (fill gaps with 0)
  const dayStats: DayStat[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const entry = byDate.get(date)
    dayStats.push({
      date,
      requests: entry?.durations.length ?? 0,
      uniqueIps: entry?.ips.size ?? 0,
      avgDurationMs: entry
        ? Math.round(entry.durations.reduce((a, b) => a + b, 0) / entry.durations.length)
        : 0,
    })
  }

  // Today / yesterday
  const today = dayStats[13]
  const yesterday = dayStats[12]

  // Recent user inputs (last 20, with filtering)
  const recentLogs = logs.slice(0, 20)

  return { dayStats, today, yesterday, feedback, recentLogs }
}

// ── Sub-components ───────────────────────────────────────────────

function Delta({ now, prev, unit = '' }: { now: number; prev: number; unit?: string }) {
  const diff = now - prev
  if (diff === 0) return <span className="text-gray-400 text-xs ml-1">持平</span>
  const color = diff > 0 ? 'text-green-500' : 'text-red-400'
  return (
    <span className={`${color} text-xs ml-1`}>
      {diff > 0 ? '+' : ''}{diff}{unit}
    </span>
  )
}

function MetricCard({ label, value, delta, unit = '' }: {
  label: string; value: string | number; delta?: number; deltaBase?: number; unit?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {delta !== undefined && <Delta now={delta} prev={0} unit={unit} />}
      </p>
    </div>
  )
}

function BarChart({ dayStats }: { dayStats: DayStat[] }) {
  const max = Math.max(...dayStats.map(d => d.requests), 1)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">14 天请求趋势</h2>
      <div className="flex items-end gap-1.5 h-28">
        {dayStats.map(day => {
          const pct = (day.requests / max) * 100
          const isToday = day.date === new Date().toISOString().slice(0, 10)
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className={`w-full rounded-t transition-all ${isToday ? 'bg-indigo-400' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                style={{ height: `${Math.max(pct, day.requests > 0 ? 4 : 0)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                <div className="bg-gray-800 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap text-center leading-snug">
                  {day.date.slice(5)}<br />
                  {day.requests} 次 · {day.uniqueIps} IP
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300">{dayStats[0]?.date.slice(5)}</span>
        <span className="text-[10px] text-indigo-400 font-medium">今日</span>
      </div>
    </div>
  )
}

function FeedbackList({ items }: { items: FeedbackRow[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">用户反馈</h2>
        <p className="text-sm text-gray-300">暂无反馈</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        用户反馈
        <span className="ml-2 text-xs font-normal text-gray-400">最近 {items.length} 条</span>
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
            <p className="text-[11px] text-gray-300 mt-1">{formatTime(item.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentLogs({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">最近用户输入</h2>
        <p className="text-sm text-gray-300">暂无数据</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        最近用户输入
        <span className="ml-2 text-xs font-normal text-gray-400">最近 {logs.length} 条</span>
      </h2>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{log.user_input}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] text-gray-300">{formatTime(log.created_at)}</span>
              <span className="text-[11px] text-gray-300">{(log.duration_ms / 1000).toFixed(1)}s</span>
              <span className="text-[11px] text-gray-300">{log.ip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ── Page ─────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || token !== adminSecret) {
    redirect('/')
  }

  const excludeIp = process.env.ADMIN_IP ?? undefined
  const { dayStats, today, yesterday, feedback, recentLogs } = await fetchAdminData(excludeIp)

  const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <TabiLogo size="sm" />
          <span className="text-xs text-gray-400">内部看板 · {todayStr}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-16">

        {/* Today's metrics */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">今日概览</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">请求数</p>
              <p className="text-2xl font-bold text-gray-900">{today.requests}</p>
              <Delta now={today.requests} prev={yesterday.requests} />
              <span className="text-xs text-gray-300 ml-1">vs 昨日</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">独立用户</p>
              <p className="text-2xl font-bold text-gray-900">{today.uniqueIps}</p>
              <Delta now={today.uniqueIps} prev={yesterday.uniqueIps} />
              <span className="text-xs text-gray-300 ml-1">vs 昨日</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">平均响应</p>
              <p className="text-2xl font-bold text-gray-900">
                {today.avgDurationMs > 0 ? `${(today.avgDurationMs / 1000).toFixed(1)}s` : '-'}
              </p>
              {yesterday.avgDurationMs > 0 && today.avgDurationMs > 0 && (
                <>
                  <Delta now={Math.round(today.avgDurationMs / 100)} prev={Math.round(yesterday.avgDurationMs / 100)} unit="s" />
                  <span className="text-xs text-gray-300 ml-1">vs 昨日</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 14-day bar chart */}
        <BarChart dayStats={dayStats} />

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 rounded-2xl p-4">
            <p className="text-xs text-indigo-400 mb-1">14 天总请求</p>
            <p className="text-2xl font-bold text-indigo-700">
              {dayStats.reduce((s, d) => s + d.requests, 0)}
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-xs text-green-500 mb-1">14 天独立用户</p>
            <p className="text-2xl font-bold text-green-700">
              {(() => {
                const allIps = new Set<string>()
                recentLogs.forEach(l => allIps.add(l.ip))
                // Note: this is only from the fetched sample, not exact
                return dayStats.reduce((s, d) => s + d.uniqueIps, 0)
              })()}
            </p>
          </div>
        </div>

        {/* Feedback */}
        <FeedbackList items={feedback} />

        {/* Recent inputs */}
        <RecentLogs logs={recentLogs} />

        {excludeIp && (
          <p className="text-center text-xs text-gray-300">已过滤 IP: {excludeIp}</p>
        )}
      </main>
    </div>
  )
}
