export function getBaseUrl() {
  // Use relative paths for internal API calls
  // This works in both server and client components
  if (typeof window !== "undefined") {
    return ""
  }

  // For server-side, use empty string for relative paths
  // Next.js will automatically resolve to the correct host
  return ""
}
