import { NextRequest, NextResponse } from "next/server"
import { searchCities } from "@/lib/israel-cities-cache"

// GET - חיפוש ערים
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ cities: [] })
    }

    const cities = searchCities(query)

    return NextResponse.json({ 
      cities,
      cached: true, // תמיד מחזיר תוצאות מקובץ מקומי
    })
  } catch (error) {
    console.error("Error searching cities:", error)
    
    // גם במקרה של שגיאה - נחזיר מערך ריק במקום לקרוס
    return NextResponse.json({ 
      cities: [],
      error: "Search temporarily unavailable" 
    })
  }
}

