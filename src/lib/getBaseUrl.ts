const PRODUCTION_SITE_URL = "https://politeia.co";

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const port = process.env.PORT;
    if (port && !process.env.VERCEL) {
      return `http://localhost:${port}`;
    }
    return PRODUCTION_SITE_URL;
  }

  return `http://localhost:${process.env.PORT || 3000}`;
}
