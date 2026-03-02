export function getServerUrl() {
  // In browser, use relative paths
  if (typeof window !== "undefined") {
    return ""
  }

  // On Vercel, use the deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // On server, use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Local development fallback
  return "http://localhost:3000"
}
