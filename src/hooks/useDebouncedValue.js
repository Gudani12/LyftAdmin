import { useEffect, useState } from 'react'

export default function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}

export function matchesSearch(values, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return values
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}
