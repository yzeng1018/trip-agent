import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { searchFlights, searchReturnFlights, searchHotels } from '@/lib/serpapi'
import { TravelIntent } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { intent }: { intent: TravelIntent } = await req.json()

    const [flights, returnFlights, hotels] = await Promise.all([
      searchFlights(intent),
      intent.tripType === 'roundtrip' ? searchReturnFlights(intent) : Promise.resolve([]),
      intent.needsHotel ? searchHotels(intent) : Promise.resolve([]),
    ])

    return NextResponse.json({ intent, flights, returnFlights, hotels })
  } catch {
    return NextResponse.json({ error: '搜索失败，请重试' }, { status: 500 })
  }
}
