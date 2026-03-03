import { Flight, Hotel } from './types'

export const mockFlights: Flight[] = [
  {
    id: 'f1',
    airline: '中国国际航空',
    airlineCode: 'CA',
    flightNumber: 'CA933',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '13:30',
    arriveTime: '18:45',
    duration: '12h 15m',
    stops: 0,
    price: 6800,
    currency: 'CNY',
    seatsLeft: 4,
    cabinClass: '经济舱',
  },
  {
    id: 'f2',
    airline: '法国航空',
    airlineCode: 'AF',
    flightNumber: 'AF129',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '22:00',
    arriveTime: '05:30+1',
    duration: '12h 30m',
    stops: 0,
    price: 7200,
    currency: 'CNY',
    seatsLeft: 8,
    cabinClass: '经济舱',
  },
  {
    id: 'f3',
    airline: '荷兰皇家航空',
    airlineCode: 'KL',
    flightNumber: 'KL896',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '09:15',
    arriveTime: '20:40',
    duration: '14h 25m',
    stops: 1,
    price: 5400,
    currency: 'CNY',
    seatsLeft: 12,
    cabinClass: '经济舱',
  },
  {
    id: 'f4',
    airline: '卡塔尔航空',
    airlineCode: 'QR',
    flightNumber: 'QR872',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '02:30',
    arriveTime: '13:20',
    duration: '13h 50m',
    stops: 1,
    price: 4900,
    currency: 'CNY',
    seatsLeft: 3,
    cabinClass: '经济舱',
  },
  {
    id: 'f5',
    airline: '中国国际航空',
    airlineCode: 'CA',
    flightNumber: 'CA937',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '16:00',
    arriveTime: '21:30',
    duration: '12h 30m',
    stops: 0,
    price: 12800,
    currency: 'CNY',
    seatsLeft: 6,
    cabinClass: '商务舱',
  },
  {
    id: 'f6',
    airline: '汉莎航空',
    airlineCode: 'LH',
    flightNumber: 'LH729',
    from: '上海浦东',
    to: '巴黎戴高乐',
    departTime: '11:40',
    arriveTime: '22:55',
    duration: '14h 15m',
    stops: 1,
    price: 5900,
    currency: 'CNY',
    seatsLeft: 15,
    cabinClass: '经济舱',
  },
]

export const mockHotels: Hotel[] = [
  {
    id: 'h1',
    name: '巴黎丽兹酒店',
    stars: 5,
    location: '旺多姆广场',
    city: '巴黎',
    pricePerNight: 6500,
    currency: 'CNY',
    rating: 9.4,
    reviewCount: 1240,
    amenities: ['免费WiFi', '餐厅', '水疗', '健身房', '管家服务'],
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    distanceToCenter: '市中心',
  },
  {
    id: 'h2',
    name: '索菲特巴黎勒弗夫尔',
    stars: 5,
    location: '奥林匹克村',
    city: '巴黎',
    pricePerNight: 3200,
    currency: 'CNY',
    rating: 8.9,
    reviewCount: 2800,
    amenities: ['免费WiFi', '餐厅', '健身房', '游泳池'],
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    distanceToCenter: '距市中心8km',
  },
  {
    id: 'h3',
    name: '巴黎美爵歌剧院酒店',
    stars: 4,
    location: '歌剧院区',
    city: '巴黎',
    pricePerNight: 1800,
    currency: 'CNY',
    rating: 8.6,
    reviewCount: 4200,
    amenities: ['免费WiFi', '餐厅', '会议室'],
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
    distanceToCenter: '距市中心1.2km',
  },
  {
    id: 'h4',
    name: '宜必思巴黎拉德芳斯',
    stars: 3,
    location: '拉德芳斯',
    city: '巴黎',
    pricePerNight: 680,
    currency: 'CNY',
    rating: 7.8,
    reviewCount: 6500,
    amenities: ['免费WiFi', '停车场'],
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
    distanceToCenter: '距市中心6km',
  },
  {
    id: 'h5',
    name: '卢浮宫美居酒店',
    stars: 4,
    location: '卢浮宫旁',
    city: '巴黎',
    pricePerNight: 2100,
    currency: 'CNY',
    rating: 8.8,
    reviewCount: 3100,
    amenities: ['免费WiFi', '餐厅', '酒吧', '健身房'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
    distanceToCenter: '距市中心0.5km',
  },
  {
    id: 'h6',
    name: '巴黎香榭丽舍大道宜必思风格',
    stars: 3,
    location: '香榭丽舍大道',
    city: '巴黎',
    pricePerNight: 920,
    currency: 'CNY',
    rating: 8.1,
    reviewCount: 5800,
    amenities: ['免费WiFi', '24小时前台'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    distanceToCenter: '市中心',
  },
]

export function filterFlights(flights: Flight[], intent: Partial<{
  airlines: string[]
  maxBudget: number
  stops: number
}>): Flight[] {
  return flights.filter(f => {
    if (intent.maxBudget && f.price > intent.maxBudget) return false
    if (intent.airlines && intent.airlines.length > 0) {
      const match = intent.airlines.some(a =>
        f.airline.includes(a) || f.airlineCode === a || a.includes(f.airlineCode)
      )
      if (!match) return false
    }
    return true
  }).sort((a, b) => a.price - b.price)
}

export function filterHotels(hotels: Hotel[], intent: Partial<{
  hotelStars: number
  maxBudget: number
  hotelLocation: string
}>): Hotel[] {
  return hotels.filter(h => {
    if (intent.hotelStars && h.stars < intent.hotelStars) return false
    if (intent.hotelLocation) {
      const loc = intent.hotelLocation.toLowerCase()
      if (loc.includes('市中心') || loc.includes('中心')) {
        if (!h.distanceToCenter.includes('市中心') && !h.distanceToCenter.includes('0')) return false
      }
    }
    return true
  }).sort((a, b) => a.pricePerNight - b.pricePerNight)
}
