export function getBaseUrl() {
  // In browser, use relative paths (works everywhere)
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

  // Detect if we're on Vercel but URL vars aren't set - use empty string for relative paths
  if (process.env.VERCEL) {
    return ""
  }

  // Local development fallback
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}
