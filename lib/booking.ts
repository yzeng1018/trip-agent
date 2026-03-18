import { FlightOption, HotelOption, TicketOption, TripFormData } from './types'

// ── Domestic city set ────────────────────────────────────────────
//
//  Used to decide: domestic route → Ctrip, international → Booking.com
//  Only covers the destination city. If destination is NOT in this set,
//  the route is treated as international.
//
const DOMESTIC_CITIES = new Set([
  // Tier-1 + major cities
  '北京', '上海', '广州', '深圳', '成都', '重庆', '杭州', '南京', '武汉', '西安',
  '苏州', '天津', '长沙', '青岛', '郑州', '昆明', '大连', '厦门', '宁波', '福州',
  '济南', '哈尔滨', '沈阳', '长春', '南宁', '海口', '三亚', '贵阳', '兰州', '西宁',
  '乌鲁木齐', '拉萨', '呼和浩特', '银川', '太原', '石家庄', '合肥', '南昌', '温州',
  '扬州', '烟台', '无锡', '常州', '徐州', '珠海', '佛山', '东莞',
  // Tourist destinations
  '丽江', '桂林', '黄山', '张家界', '九寨沟', '峨眉山', '敦煌', '喀什',
  '西双版纳', '稻城', '香格里拉', '凤凰', '阳朔', '泸沽湖', '色达',
])

export function isInternationalRoute(destination?: string | null): boolean {
  if (!destination) return false
  return !DOMESTIC_CITIES.has(destination.trim())
}

// ── Helpers ──────────────────────────────────────────────────────

function parseTravelers(travelers?: string): number {
  if (!travelers) return 1
  if (travelers === '3+') return 3
  const n = parseInt(travelers, 10)
  return isNaN(n) ? 1 : Math.min(Math.max(n, 1), 9)
}

function parseDuration(duration?: string): number {
  if (!duration) return 3
  if (duration === '10+') return 10
  const n = parseInt(duration, 10)
  return isNaN(n) ? 3 : n
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── URL builders ─────────────────────────────────────────────────

function buildFlightUrl(intent: Partial<TripFormData>): string {
  const adult = parseTravelers(intent.travelers)
  const from = intent.origin?.trim()
  const to = intent.destination?.trim()

  if (isInternationalRoute(to)) {
    // Ctrip international flight search
    const parts: string[] = [`adult=${adult}`, 'cabin=y']
    if (from) parts.push(`dcity=${encodeURIComponent(from)}`)
    if (to) parts.push(`acity=${encodeURIComponent(to)}`)
    if (intent.departDate) parts.push(`date=${intent.departDate.replace(/-/g, '')}`)
    return `https://flights.ctrip.com/international/search/oneway?${parts.join('&')}`
  } else {
    // Ctrip domestic flight search
    const parts: string[] = [`adult=${adult}`]
    if (from) parts.push(`fromCity=${encodeURIComponent(from)}`)
    if (to) parts.push(`toCity=${encodeURIComponent(to)}`)
    if (intent.departDate) parts.push(`departDate=${intent.departDate}`)
    return `https://m.ctrip.com/webapp/flights/domestic/?${parts.join('&')}`
  }
}

function buildHotelUrl(intent: Partial<TripFormData>, hotelName?: string): string {
  const adults = parseTravelers(intent.travelers)
  const duration = parseDuration(intent.duration)
  const city = intent.destination?.trim()

  if (isInternationalRoute(city)) {
    // Booking.com for international hotels
    const query = hotelName && city ? `${hotelName} ${city}` : (city ?? hotelName ?? '')
    const parts: string[] = [
      `ss=${encodeURIComponent(query)}`,
      `group_adults=${adults}`,
      'no_rooms=1',
    ]
    if (intent.departDate) {
      parts.push(`checkin=${intent.departDate}`)
      parts.push(`checkout=${addDays(intent.departDate, duration)}`)
    }
    return `https://www.booking.com/searchresults.html?${parts.join('&')}`
  } else {
    // Ctrip for domestic hotels
    const parts: string[] = [`adult=${adults}`]
    if (city) parts.push(`city=${encodeURIComponent(city)}`)
    if (intent.departDate) {
      parts.push(`checkin=${intent.departDate}`)
      parts.push(`checkout=${addDays(intent.departDate, duration)}`)
    }
    return `https://m.ctrip.com/webapp/hotel/list/?${parts.join('&')}`
  }
}

function buildTicketUrl(attraction: string): string {
  return `https://www.klook.com/zh-CN/search/?query=${encodeURIComponent(attraction)}`
}

// ── Main export ──────────────────────────────────────────────────

export function buildBookingUrl(
  intent: Partial<TripFormData>,
  item: FlightOption | HotelOption | TicketOption,
  type: 'flight' | 'hotel' | 'ticket'
): string {
  if (type === 'flight') return buildFlightUrl(intent)
  if (type === 'hotel') return buildHotelUrl(intent, (item as HotelOption).name)
  return buildTicketUrl((item as TicketOption).attraction)
}

export function getPlatformName(url: string): string {
  if (url.includes('booking.com')) return 'Booking.com'
  if (url.includes('klook.com')) return 'Klook'
  return '携程'
}
