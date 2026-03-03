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

export interface Flight {
  id: string
  airline: string
  airlineCode: string
  flightNumber: string
  from: string
  to: string
  departTime: string
  arriveTime: string
  duration: string
  stops: number
  price: number
  currency: string
  seatsLeft: number
  cabinClass: string
  bookingUrl?: string
}

export interface Hotel {
  id: string
  name: string
  stars: number
  location: string
  city: string
  pricePerNight: number
  currency: string
  rating: number
  reviewCount: number
  amenities: string[]
  imageUrl: string
  distanceToCenter: string
  bookingUrl?: string
}

export interface SearchResults {
  intent: TravelIntent
  flights: Flight[]
  returnFlights?: Flight[]
  hotels: Hotel[]
}
