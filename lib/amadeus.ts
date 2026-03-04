import Amadeus from 'amadeus'
import { Flight, Hotel, TravelIntent } from './types'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!,
})

// 城市名 → IATA 机场代码
const CITY_TO_IATA: Record<string, string> = {
  '上海': 'SHA', '北京': 'BJS', '广州': 'CAN', '深圳': 'SZX',
  '成都': 'CTU', '杭州': 'HGH', '南京': 'NKG', '武汉': 'WUH',
  '西安': 'XIY', '重庆': 'CKG', '厦门': 'XMN', '青岛': 'TAO',
  '巴黎': 'PAR', '伦敦': 'LON', '纽约': 'NYC', '东京': 'TYO',
  '新加坡': 'SIN', '首尔': 'SEL', '曼谷': 'BKK', '迪拜': 'DXB',
  '洛杉矶': 'LAX', '旧金山': 'SFO', '悉尼': 'SYD', '墨尔本': 'MEL',
  '香港': 'HKG', '台北': 'TPE', '澳门': 'MFM', '大阪': 'OSA',
  '罗马': 'ROM', '巴塞罗那': 'BCN', '阿姆斯特丹': 'AMS', '法兰克福': 'FRA',
  '多哈': 'DOH', '吉隆坡': 'KUL',
}

function getIATA(city: string): string {
  // 直接匹配
  if (CITY_TO_IATA[city]) return CITY_TO_IATA[city]
  // 模糊匹配
  const key = Object.keys(CITY_TO_IATA).find(k => city.includes(k) || k.includes(city))
  return key ? CITY_TO_IATA[key] : city
}

// 航司代码 → 中文名
const AIRLINE_NAMES: Record<string, string> = {
  'CA': '中国国际航空', 'MU': '中国东方航空', 'CZ': '中国南方航空',
  'AF': '法国航空', 'KL': '荷兰皇家航空', 'LH': '汉莎航空',
  'BA': '英国航空', 'UA': '美国联合航空', 'AA': '美国航空',
  'DL': '达美航空', 'QR': '卡塔尔航空', 'EK': '阿联酋航空',
  'SQ': '新加坡航空', 'CX': '国泰航空', 'NH': '全日空',
  'JL': '日本航空', 'KE': '大韩航空', 'OZ': '韩亚航空',
  'TG': '泰国航空', 'MH': '马来西亚航空', 'QF': '澳洲航空',
}

function formatDuration(iso: string): string {
  // PT12H30M → 12h 30m
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}h` : ''
  const m = match[2] ? ` ${match[2]}m` : ''
  return `${h}${m}`.trim()
}

function formatTime(datetime: string): string {
  // 2026-04-10T13:30:00 → 13:30
  return datetime.slice(11, 16)
}

export async function searchFlights(intent: TravelIntent): Promise<Flight[]> {
  const originCode = getIATA(intent.from)
  const destCode = getIATA(intent.to)

  try {
    const res = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destCode,
      departureDate: intent.departDate,
      adults: intent.passengers,
      max: 10,
      currencyCode: 'CNY',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((offer: any, idx: number) => {
      const itinerary = offer.itineraries[0]
      const firstSeg = itinerary.segments[0]
      const lastSeg = itinerary.segments[itinerary.segments.length - 1]
      const airlineCode = firstSeg.carrierCode
      const price = Math.round(parseFloat(offer.price.grandTotal))

      return {
        id: offer.id || `f${idx}`,
        airline: AIRLINE_NAMES[airlineCode] || airlineCode,
        airlineCode,
        flightNumber: `${airlineCode}${firstSeg.number}`,
        from: firstSeg.departure.iataCode,
        to: lastSeg.arrival.iataCode,
        departTime: formatTime(firstSeg.departure.at),
        arriveTime: formatTime(lastSeg.arrival.at),
        duration: formatDuration(itinerary.duration),
        stops: itinerary.segments.length - 1,
        price,
        currency: 'CNY',
        seatsLeft: offer.numberOfBookableSeats || 9,
        cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin === 'BUSINESS' ? '商务舱' : '经济舱',
      } as Flight
    }).filter((f: Flight) => !intent.maxBudget || f.price <= intent.maxBudget)
      .filter((f: Flight) => {
        if (!intent.airlines || intent.airlines.length === 0) return true
        return intent.airlines.some(a =>
          f.airline.includes(a) || f.airlineCode === a || a.includes(f.airlineCode)
        )
      })
  } catch (e) {
    console.error('Amadeus flights error:', e)
    return []
  }
}

export async function searchReturnFlights(intent: TravelIntent): Promise<Flight[]> {
  if (!intent.returnDate) return []
  const originCode = getIATA(intent.to)
  const destCode = getIATA(intent.from)

  try {
    const res = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destCode,
      departureDate: intent.returnDate,
      adults: intent.passengers,
      max: 10,
      currencyCode: 'CNY',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((offer: any, idx: number) => {
      const itinerary = offer.itineraries[0]
      const firstSeg = itinerary.segments[0]
      const lastSeg = itinerary.segments[itinerary.segments.length - 1]
      const airlineCode = firstSeg.carrierCode
      const price = Math.round(parseFloat(offer.price.grandTotal))

      return {
        id: offer.id + '-r' || `r${idx}`,
        airline: AIRLINE_NAMES[airlineCode] || airlineCode,
        airlineCode,
        flightNumber: `${airlineCode}${firstSeg.number}`,
        from: firstSeg.departure.iataCode,
        to: lastSeg.arrival.iataCode,
        departTime: formatTime(firstSeg.departure.at),
        arriveTime: formatTime(lastSeg.arrival.at),
        duration: formatDuration(itinerary.duration),
        stops: itinerary.segments.length - 1,
        price,
        currency: 'CNY',
        seatsLeft: offer.numberOfBookableSeats || 9,
        cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin === 'BUSINESS' ? '商务舱' : '经济舱',
      } as Flight
    })
  } catch (e) {
    console.error('Amadeus return flights error:', e)
    return []
  }
}

export async function searchHotels(intent: TravelIntent): Promise<Hotel[]> {
  const cityCode = getIATA(intent.to)
  const nights = intent.returnDate
    ? Math.max(1, Math.round((new Date(intent.returnDate).getTime() - new Date(intent.departDate).getTime()) / 86400000))
    : 7

  try {
    // 先获取酒店列表
    const listRes = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode,
      ratings: intent.hotelStars ? [intent.hotelStars, 5].filter(r => r >= intent.hotelStars!).join(',') : '3,4,5',
    })

    const hotelIds = listRes.data.slice(0, 20).map((h: any) => h.hotelId)
    if (hotelIds.length === 0) return []

    // 查询价格
    const offersRes = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds: hotelIds.join(','),
      checkInDate: intent.departDate,
      checkOutDate: intent.returnDate || intent.departDate,
      adults: intent.passengers,
      currencyCode: 'CNY',
      bestRateOnly: true,
    })

    return offersRes.data.slice(0, 9).map((item: any, idx: number) => {
      const hotel = item.hotel
      const offer = item.offers?.[0]
      const pricePerNight = offer ? Math.round(parseFloat(offer.price.total) / nights) : 0

      return {
        id: hotel.hotelId || `h${idx}`,
        name: hotel.name,
        stars: hotel.rating ? parseInt(hotel.rating) : 3,
        location: hotel.address?.cityName || intent.to,
        city: intent.to,
        pricePerNight,
        currency: 'CNY',
        rating: hotel.rating ? parseFloat(hotel.rating) : 7.5,
        reviewCount: Math.floor(Math.random() * 5000) + 500,
        amenities: ['免费WiFi', '餐厅'],
        imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400`,
        distanceToCenter: hotel.distance?.value
          ? `距市中心${hotel.distance.value}km`
          : '市中心',
      } as Hotel
    }).filter((h: Hotel) => h.pricePerNight > 0)
  } catch (e) {
    console.error('Amadeus hotels error:', e)
    return []
  }
}
