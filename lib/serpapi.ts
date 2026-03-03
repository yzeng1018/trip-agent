import { Flight, Hotel, TravelIntent } from './types'

const SERPAPI_KEY = process.env.SERPAPI_KEY!

// 城市名 → IATA 机场代码
const CITY_TO_IATA: Record<string, string> = {
  '上海': 'PVG', '北京': 'PEK', '广州': 'CAN', '深圳': 'SZX',
  '成都': 'CTU', '杭州': 'HGH', '南京': 'NKG', '武汉': 'WUH',
  '西安': 'XIY', '重庆': 'CKG', '厦门': 'XMN', '青岛': 'TAO',
  '巴黎': 'CDG', '伦敦': 'LHR', '纽约': 'JFK', '东京': 'NRT',
  '新加坡': 'SIN', '首尔': 'ICN', '曼谷': 'BKK', '迪拜': 'DXB',
  '洛杉矶': 'LAX', '旧金山': 'SFO', '悉尼': 'SYD', '墨尔本': 'MEL',
  '香港': 'HKG', '台北': 'TPE', '澳门': 'MFM', '大阪': 'KIX',
  '罗马': 'FCO', '巴塞罗那': 'BCN', '阿姆斯特丹': 'AMS', '法兰克福': 'FRA',
  '多哈': 'DOH', '吉隆坡': 'KUL', '雅加达': 'CGK', '孟买': 'BOM',
}

function getIATA(city: string): string {
  if (CITY_TO_IATA[city]) return CITY_TO_IATA[city]
  const key = Object.keys(CITY_TO_IATA).find(k => city.includes(k) || k.includes(city))
  return key ? CITY_TO_IATA[key] : city
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function serpFetch(params: Record<string, any>): Promise<any> {
  const query = new URLSearchParams({ ...params, api_key: SERPAPI_KEY }).toString()
  const res = await fetch(`https://serpapi.com/search?${query}`)
  if (!res.ok) throw new Error(`SerpApi error: ${res.status}`)
  return res.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFlightOffer(offer: any, idx: number, suffix = '', searchParams?: { from: string; to: string; date: string; passengers: number }): Flight {
  const leg = offer.flights?.[0]
  const lastLeg = offer.flights?.[offer.flights.length - 1]
  const airlineCode = leg?.airline_logo?.match(/\/([A-Z0-9]{2})\./)?.[1] || 'XX'
  const airline = leg?.airline || airlineCode
  const flightNum = leg?.flight_number || `${airlineCode}${idx}`
  const price = offer.price || 0

  // Google Flights 搜索链接
  const bookingUrl = searchParams
    ? `https://www.google.com/flights?hl=zh#flt=${searchParams.from}.${searchParams.to}.${searchParams.date};c:CNY;e:1;sd:1;t:f`
    : undefined

  return {
    id: `${flightNum}${suffix}-${idx}`,
    airline,
    airlineCode,
    flightNumber: flightNum,
    from: leg?.departure_airport?.id || '',
    to: lastLeg?.arrival_airport?.id || '',
    departTime: leg?.departure_airport?.time?.slice(11, 16) || '',
    arriveTime: lastLeg?.arrival_airport?.time?.slice(11, 16) || '',
    duration: offer.total_duration ? `${Math.floor(offer.total_duration / 60)}h ${offer.total_duration % 60}m` : '',
    stops: (offer.flights?.length || 1) - 1,
    price: Math.round(price),
    currency: 'CNY',
    seatsLeft: 9,
    cabinClass: offer.travel_class === 'Business' ? '商务舱' : '经济舱',
    bookingUrl,
  }
}

export async function searchFlights(intent: TravelIntent): Promise<Flight[]> {
  const originCode = getIATA(intent.from)
  const destCode = getIATA(intent.to)

  try {
    const data = await serpFetch({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: intent.departDate,
      type: '2', // one-way (去程单独搜)
      adults: intent.passengers,
      currency: 'CNY',
      hl: 'zh-cn',
      ...(intent.maxBudget ? { max_price: intent.maxBudget } : {}),
    })

    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ]

    return allFlights
      .slice(0, 8)
      .map((offer: any, idx: number) => parseFlightOffer(offer, idx, '', { from: originCode, to: destCode, date: intent.departDate, passengers: intent.passengers }))
      .filter((f: Flight) => {
        if (!intent.airlines || intent.airlines.length === 0) return true
        return intent.airlines.some(a =>
          f.airline.includes(a) || f.airlineCode === a || a.includes(f.airlineCode)
        )
      })
  } catch (e) {
    console.error('SerpApi flights error:', e)
    return []
  }
}

export async function searchReturnFlights(intent: TravelIntent): Promise<Flight[]> {
  if (!intent.returnDate) return []
  const originCode = getIATA(intent.to)
  const destCode = getIATA(intent.from)

  try {
    const data = await serpFetch({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: intent.returnDate,
      type: '2',
      adults: intent.passengers,
      currency: 'CNY',
      hl: 'zh-cn',
    })

    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ]

    return allFlights
      .slice(0, 8)
      .map((offer: any, idx: number) => parseFlightOffer(offer, idx, '-r', { from: originCode, to: destCode, date: intent.returnDate!, passengers: intent.passengers }))
  } catch (e) {
    console.error('SerpApi return flights error:', e)
    return []
  }
}

export async function searchHotels(intent: TravelIntent): Promise<Hotel[]> {
  const checkOut = intent.returnDate || intent.departDate

  try {
    const data = await serpFetch({
      engine: 'google_hotels',
      q: `${intent.to} hotels`,
      check_in_date: intent.departDate,
      check_out_date: checkOut,
      adults: intent.passengers,
      currency: 'CNY',
      hl: 'zh-cn',
      ...(intent.hotelStars ? { hotel_class: intent.hotelStars } : {}),
    })

    const properties = data.properties || []

    return properties.slice(0, 9).map((h: any, idx: number) => {
      const pricePerNight = h.rate_per_night?.extracted_lowest || h.rate_per_night?.lowest?.replace(/[^0-9]/g, '') || 0

      return {
        id: h.property_token || `h${idx}`,
        name: h.name,
        stars: h.hotel_class || 3,
        location: h.neighborhood || intent.to,
        city: intent.to,
        pricePerNight: Math.round(Number(pricePerNight)),
        currency: 'CNY',
        rating: h.overall_rating || 7.5,
        reviewCount: h.reviews || 0,
        amenities: (h.amenities || []).slice(0, 5),
        imageUrl: h.images?.[0]?.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        distanceToCenter: h.nearby_places?.[0]?.name || '市中心',
        bookingUrl: h.link || `https://www.google.com/travel/hotels/entity/${h.property_token}`,
      } as Hotel
    }).filter((h: Hotel) => {
      if (intent.hotelStars && h.stars < intent.hotelStars) return false
      return h.pricePerNight > 0
    })
  } catch (e) {
    console.error('SerpApi hotels error:', e)
    return []
  }
}
