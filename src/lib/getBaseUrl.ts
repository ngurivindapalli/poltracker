export function getBaseUrl() {
  // In browser, use relative paths
  if (typeof window !== "undefined") {
    return ""
  }

  // On server, use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback: empty string for relative paths (works on both local and Vercel)
  return ""
}
