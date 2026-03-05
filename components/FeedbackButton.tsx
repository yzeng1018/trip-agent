'use client'

import { useState } from 'react'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
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
    if (res.ok) {
      setStatus('done')
      setContent('')
      setTimeout(() => { setOpen(false); setStatus('idle') }, 1500)
    } else {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg hover:bg-white hover:shadow-xl transition-all"
      >
        <span>💬</span>
        <span>反馈</span>
      </button>

      {/* 遮罩 + 弹窗 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setStatus('idle') } }}
        >
          <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">你的反馈</h2>
              <button onClick={() => { setOpen(false); setStatus('idle') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {status === 'done' ? (
              <p className="text-center text-green-600 py-6 text-sm">感谢反馈！✨</p>
            ) : (
              <>
                <textarea
                  className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="告诉我哪里可以改进，或者你想要的功能…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                {status === 'error' && <p className="text-xs text-red-500">提交失败，请稍后再试</p>}
                <button
                  onClick={submit}
                  disabled={status === 'loading' || !content.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'loading' ? '提交中…' : '提交'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
