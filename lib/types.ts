// ── Itinerary Planning (primary) ──────────────────────────────

export interface TripRequest {
  destination: string
  duration: number        // days
  departDate?: string
  travelers: number
  budget?: number
  currency: string
  style?: string          // e.g. 轻奢、背包、亲子、蜜月
  interests?: string[]    // e.g. 美食、文化、自然、购物
  userMessage: string     // original raw message
}

export interface Activity {
  time: string            // 上午 / 下午 / 晚上 or HH:MM
  title: string
  description: string
  location: string
  type: 'sightseeing' | 'food' | 'transport' | 'accommodation' | 'activity' | 'tip'
  estimatedCost?: string
  tips?: string
}

export interface DayPlan {
  day: number
  date?: string
  title: string
  activities: Activity[]
}

export interface TripPlan {
  request: TripRequest
  title: string
  summary: string
  destination: string
  duration: number
  days: DayPlan[]
  practicalTips: string[]
  estimatedBudget?: string
}

// ── Legacy flight/hotel types (kept for future use) ───────────

export interface TravelIntent {
  from: string
  to: string
  departDate: string
  returnDate?: string
  passengers: number
  airlines?: string[]
  maxBudget?: number
  currency: string
  hotelStars?: number
  hotelLocation?: string
  tripType: 'roundtrip' | 'oneway'
  needsHotel: boolean
}
