import { useState, useEffect, useCallback } from "react"

interface City {
  cityName: string
  cityCode: string
}

interface Street {
  streetName: string
  cityName: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook לחיפוש ערים בישראל
 */
export function useCitySearch(storeSlug: string) {
  const [query, setQuery] = useState("")
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300) // המתנה של 300ms אחרי הפסקת הקלדה

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setCities([])
      return
    }

    const searchCities = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/storefront/${storeSlug}/cities?q=${encodeURIComponent(debouncedQuery)}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setCities(data.cities || [])
        } else {
          setCities([])
        }
      } catch (error) {
        console.error("Error searching cities:", error)
        setCities([])
      } finally {
        setLoading(false)
      }
    }

    searchCities()
  }, [debouncedQuery, storeSlug])

  return {
    query,
    setQuery,
    cities,
    loading,
  }
}

/**
 * Hook לחיפוש רחובות בישראל
 */
export function useStreetSearch(storeSlug: string, cityName: string) {
  const [query, setQuery] = useState("")
  const [streets, setStreets] = useState<Street[]>([])
  const [loading, setLoading] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !cityName) {
      setStreets([])
      return
    }

    const searchStreets = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/storefront/${storeSlug}/streets?q=${encodeURIComponent(debouncedQuery)}&city=${encodeURIComponent(cityName)}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setStreets(data.streets || [])
        } else {
          setStreets([])
        }
      } catch (error) {
        console.error("Error searching streets:", error)
        setStreets([])
      } finally {
        setLoading(false)
      }
    }

    searchStreets()
  }, [debouncedQuery, cityName, storeSlug])

  return {
    query,
    setQuery,
    streets,
    loading,
  }
}

