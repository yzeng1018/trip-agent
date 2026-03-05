'use client'

import { forwardRef } from 'react'
import { TabiLogo } from '@/components/TabiLogo'
import { TripPlan } from '@/lib/types'

const ACTIVITY_ICONS: Record<string, string> = {
  sightseeing: '🏛',
  food: '🍜',
  transport: '🚌',
  accommodation: '🏨',
  activity: '🎯',
  tip: '💡',
}

interface ShareCardProps {
  plan: TripPlan
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ plan }, ref) {
    const tags = [
      plan.request.style,
      ...(plan.request.interests ?? []),
    ].filter(Boolean)

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          background: '#f5f3ff',
          fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '24px 24px 20px',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <TabiLogo size="sm" theme="light" />
          </div>
          <div style={{ color: '#ffffff', fontSize: 19, fontWeight: 700, lineHeight: 1.3, marginBottom: 5 }}>
            {plan.title}
          </div>
          <div style={{ color: '#c4b5fd', fontSize: 13 }}>
            {plan.destination} · {plan.duration} 天
            {plan.request.travelers > 1 ? ` · ${plan.request.travelers} 人` : ''}
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding: '14px 24px 0', fontSize: 12, color: '#6b5fa5', lineHeight: 1.6 }}>
          {plan.summary}
        </div>

        {/* Day list */}
        <div style={{ padding: '14px 24px 0' }}>
          {plan.days.map((day) => {
            // Show up to 3 non-transport, non-tip activities
            const highlights = day.activities
              .filter(a => a.type !== 'transport' && a.type !== 'tip')
              .slice(0, 3)

            return (
              <div
                key={day.day}
                style={{
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid #ede9fe',
                }}
              >
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 3,
                      height: 32,
                      background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Day {day.day}{day.date ? ` · ${day.date}` : ''}
                    </div>
                    <div style={{ fontSize: 14, color: '#1e1b4b', fontWeight: 700 }}>
                      {day.title}
                    </div>
                  </div>
                </div>

                {/* Activity highlights */}
                {highlights.length > 0 && (
                  <div style={{ paddingLeft: 11 }}>
                    {highlights.map((act, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          marginBottom: i < highlights.length - 1 ? 5 : 0,
                        }}
                      >
                        <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                          {ACTIVITY_ICONS[act.type] ?? '📍'}
                        </span>
                        <div>
                          <span style={{ fontSize: 12, color: '#3730a3', fontWeight: 600 }}>
                            {act.title}
                          </span>
                          {act.location && (
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
                              {act.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Budget + tags */}
        <div style={{ padding: '0 24px 20px' }}>
          {plan.estimatedBudget && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 12,
                color: '#15803d',
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              💰 预算参考：{plan.estimatedBudget}
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    background: '#ede9fe',
                    color: '#5b21b6',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              borderTop: '1px solid #ede9fe',
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 11, color: '#a78bfa' }}>用 Tabi 规划你的旅程</div>
            <div style={{ fontSize: 11, color: '#c4b5fd' }}>asktabi.com</div>
          </div>
        </div>
      </div>
    )
  }
)
