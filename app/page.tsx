'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ParsedIntent } from '@/components/ParsedIntent'
import { TravelIntent } from '@/lib/types'

const EXAMPLES = [
  '我想从上海飞巴黎，4月10号出发，4月20号回来，两个人，预算8000一个人，最好是国航或法航，4星以上酒店市中心',
  '北京到东京，5月1日单程，一个人，越便宜越好',
  '广州飞纽约 6月15号出发 6月30回 商务舱',
]

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<TravelIntent | null>(null)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })
      const parseData = await parseRes.json()
      if (!parseRes.ok) throw new Error(parseData.error)

      setPreview(parseData.intent)

      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: parseData.intent }),
      })
      const searchData = await searchRes.json()
      if (!searchRes.ok) throw new Error(searchData.error)

      const encoded = encodeURIComponent(JSON.stringify(searchData))
      router.push(`/results?data=${encoded}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '出错了，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">✈️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Trip Agent</h1>
          <p className="text-lg text-gray-500">
            用自然语言描述你的出行需求，AI 帮你找到最合适的机票和酒店
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSearch()
            }}
            placeholder="例如：我想从上海飞巴黎，4月10号出发，两个人，预算8000一个人..."
            className="w-full resize-none text-gray-800 text-base leading-relaxed placeholder-gray-300 outline-none min-h-[100px]"
            rows={3}
          />

          {preview && (
            <div className="mt-2 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">AI 理解</p>
              <ParsedIntent intent={preview} />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">⌘ + Enter 搜索</p>
            <button
              onClick={handleSearch}
              disabled={loading || !input.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <><span className="animate-spin inline-block">⟳</span> AI 解析中...</> : '搜索'}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs text-gray-400 mb-3 text-center">试试这些例子</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                className="text-left px-4 py-3 bg-white/60 hover:bg-white rounded-2xl text-sm text-gray-600 hover:text-gray-900 border border-gray-100 hover:border-gray-200 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
