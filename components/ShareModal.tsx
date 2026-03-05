'use client'

import { useRef, useState } from 'react'
import { TripPlan } from '@/lib/types'
import { ShareCard } from '@/components/ShareCard'

interface ShareModalProps {
  plan: TripPlan
  onClose: () => void
}

export function ShareModal({ plan, onClose }: ShareModalProps) {
  // Hidden full-size card used for capture (not clipped by modal scroll)
  const captureRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    if (!captureRef.current) return
    setGenerating(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f5f3ff',
      })
      const link = document.createElement('a')
      link.download = `${plan.destination}-行程.png`
      link.href = dataUrl
      link.click()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {/* Hidden full-size card for capture — off-screen, not clipped */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <ShareCard ref={captureRef} plan={plan} />
      </div>

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-800">分享行程</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Scrollable preview */}
          <div className="p-5 overflow-y-auto max-h-[65vh] flex justify-center">
            <ShareCard plan={plan} />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  下载图片
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
