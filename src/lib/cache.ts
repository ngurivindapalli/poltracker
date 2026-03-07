const cache = new Map<string, { value: any; expiry: number }>()

export function getCache(key: string): any | null {
  const item = cache.get(key)
  
  if (!item) return null
  
  if (Date.now() > item.expiry) {
    cache.delete(key)
    return null
  }
  
  return item.value
}

export function setCache(key: string, value: any, ttl: number = 600000): void {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl
  })
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
