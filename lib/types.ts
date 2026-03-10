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

export interface Transport {
  type: 'flight' | 'train' | 'bus'
  description: string    // e.g. "上海虹桥 → 大阪关西，直飞约2.5小时"
  duration: string       // e.g. "2.5小时"
  priceRange: string     // e.g. "¥800-1500/人（经济舱）"
  tips: string           // e.g. "提前2周购票更划算"
}

export interface HotelRecommendation {
  name: string
  area: string           // e.g. "难波·心斋桥商圈"
  pricePerNight: string  // e.g. "¥400-600/晚"
  highlights: string[]   // max 3 items
  tips: string
}

export interface TripPlan {
  request: TripRequest
  title: string
  summary: string
  destination: string
  duration: number
  gettingThere?: Transport
  gettingAround?: string
  hotel?: HotelRecommendation
  days: DayPlan[]
  practicalTips: string[]
  estimatedBudget?: string
}

// ── Booking Recommendations ────────────────────────────────────

export interface FlightOption {
  airline: string
  flightNo: string
  route: string          // e.g. "北京 → 东京成田"
  departTime: string
  arriveTime: string
  duration: string
  stops: number
  priceRange: string     // e.g. "¥2800-3500/人"
  highlights: string[]   // e.g. ["直飞", "含23kg行李"]
  tips: string
  bookingUrl: string     // Ctrip deep link
}

export interface HotelOption {
  name: string
  stars: number
  area: string
  pricePerNight: string  // e.g. "¥800-1200/晚"
  highlights: string[]
  tips: string
  bookingUrl: string     // Booking.com deep link
}

export interface TicketOption {
  attraction: string
  priceRange: string
  highlights: string[]
  tips: string
  bookingUrl: string     // Klook deep link
}

export interface BookingPlan {
  type: 'booking'
  query: string
  flights: FlightOption[]
  hotels: HotelOption[]
  tickets: TicketOption[]
}

// ── Legacy flight/hotel types (kept for future use) ───────────

export interface Hotel {
  id?: string
  name: string
  stars: number
  location: string
  city?: string
  distanceToCenter: string
  rating: number
  reviewCount: number
  pricePerNight: number
  currency?: string
  amenities: string[]
  imageUrl: string
  bookingUrl?: string
}

export interface Flight {
  id?: string
  airline: string
  airlineCode: string
  flightNumber: string
  cabinClass: string
  from: string
  to: string
  departTime: string
  arriveTime: string
  duration: string
  stops: number
  price: number
  currency?: string
  seatsLeft: number
  bookingUrl?: string
}

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
