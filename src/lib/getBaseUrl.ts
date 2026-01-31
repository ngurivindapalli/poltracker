export function getBaseUrl(): string {
  // In the browser, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // On the server, try to get from environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Fallback to localhost for development
  return `http://localhost:${process.env.PORT ?? 3000}`
}
