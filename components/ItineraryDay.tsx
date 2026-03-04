import { DayPlan, Activity } from '@/lib/types'

const TYPE_ICON: Record<Activity['type'], string> = {
  sightseeing: '🏛',
  food: '🍜',
  transport: '🚌',
  accommodation: '🏨',
  activity: '🎯',
  tip: '💡',
}

const TYPE_COLOR: Record<Activity['type'], string> = {
  sightseeing: 'bg-blue-50 border-blue-100',
  food: 'bg-orange-50 border-orange-100',
  transport: 'bg-gray-50 border-gray-100',
  accommodation: 'bg-purple-50 border-purple-100',
  activity: 'bg-green-50 border-green-100',
  tip: 'bg-yellow-50 border-yellow-100',
}

export function ItineraryDay({ day }: { day: DayPlan }) {
  return (
    <div className="mb-10">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {day.day}
        </div>
        <div>
          <p className="text-xs text-gray-400 leading-none mb-0.5">Day {day.day}{day.date ? ` · ${day.date}` : ''}</p>
          <h3 className="text-base font-semibold text-gray-900">{day.title}</h3>
        </div>
      </div>

      {/* Activities */}
      <div className="ml-5 border-l-2 border-gray-100 pl-6 space-y-3">
        {day.activities.map((act, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-4 ${TYPE_COLOR[act.type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[act.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-gray-400 font-medium">{act.time}</span>
                  <h4 className="text-sm font-semibold text-gray-900">{act.title}</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{act.description}</p>
                {act.location && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {act.location}
                    {act.estimatedCost && <span className="ml-2">· {act.estimatedCost}</span>}
                  </p>
                )}
                {act.tips && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2">
                    💡 {act.tips}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
