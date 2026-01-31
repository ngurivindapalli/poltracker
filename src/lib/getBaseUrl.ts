export function getBaseUrl(): string {
  // On Vercel, use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback to localhost for local development
  return 'http://localhost:3000'
}
