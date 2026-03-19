import { DayPlan, Activity } from '@/lib/types'
import {
  Landmark,
  UtensilsCrossed,
  Bus,
  Hotel,
  Compass,
  Lightbulb,
  MapPin,
} from 'lucide-react'

const TYPE_CONFIG: Record<
  Activity['type'],
  {
    icon: React.ReactNode
    border: string
    iconBg: string
    tipBg: string
  }
> = {
  sightseeing: {
    icon: <Landmark className="w-3.5 h-3.5" />,
    border: 'border-l-blue-400',
    iconBg: 'bg-blue-50 text-blue-500',
    tipBg: 'bg-blue-50',
  },
  food: {
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    border: 'border-l-amber-400',
    iconBg: 'bg-amber-50 text-amber-500',
    tipBg: 'bg-amber-50',
  },
  transport: {
    icon: <Bus className="w-3.5 h-3.5" />,
    border: 'border-l-slate-300',
    iconBg: 'bg-slate-100 text-slate-400',
    tipBg: 'bg-slate-50',
  },
  accommodation: {
    icon: <Hotel className="w-3.5 h-3.5" />,
    border: 'border-l-violet-400',
    iconBg: 'bg-violet-50 text-violet-500',
    tipBg: 'bg-violet-50',
  },
  activity: {
    icon: <Compass className="w-3.5 h-3.5" />,
    border: 'border-l-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-500',
    tipBg: 'bg-emerald-50',
  },
  tip: {
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    border: 'border-l-orange-300',
    iconBg: 'bg-orange-50 text-orange-400',
    tipBg: 'bg-orange-50',
  },
}

export function ItineraryDay({ day }: { day: DayPlan }) {
  return (
    <div className="mb-8">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-3.5">
        <div
          className="w-10 h-10 rounded-2xl text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          {day.day}
        </div>
        <div>
          <p className="text-xs text-slate-400 leading-none mb-0.5 font-medium">
            Day {day.day}
            {day.date ? ` · ${day.date}` : ''}
          </p>
          <h3 className="text-base font-semibold text-slate-900">{day.title}</h3>
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-2.5 pl-[52px]">
        {day.activities.map((act, i) => {
          const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.activity
          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${cfg.border} shadow-sm overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg}`}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      {act.time && (
                        <span className="text-xs text-slate-400 font-medium tabular-nums">
                          {act.time}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {act.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{act.description}</p>
                    {(act.location || act.estimatedCost) && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {act.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {act.location}
                          </span>
                        )}
                        {act.estimatedCost && (
                          <span className="text-xs text-slate-400">· {act.estimatedCost}</span>
                        )}
                      </div>
                    )}
                    {act.tips && (
                      <div className="flex items-start gap-1.5 mt-2 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">{act.tips}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
