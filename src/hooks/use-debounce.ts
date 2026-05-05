"use client"

import { useEffect, useState } from "react"

export function useDebounce<T>(
  initialValue: T,
  delay: number
): [T, (value: T) => void, T] {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return [value, setValue, debouncedValue]
}
