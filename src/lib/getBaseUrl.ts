export function getBaseUrl() {
  // In browser (client-side), use relative paths (works everywhere)
  if (typeof window !== "undefined") {
    return ""
  }

  // On Vercel production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Vercel system URL (alternative)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Custom site URL from env
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Server-side: need absolute URL for fetch
  // Use localhost with PORT from environment or default to 3000
  return `http://localhost:${process.env.PORT || 3000}`
}
