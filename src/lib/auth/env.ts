function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getAuthSecret(): string | undefined {
  return firstEnv("AUTH_SECRET", "NEXTAUTH_SECRET");
}

export function getAuthUrl(): string {
  return (
    firstEnv("AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL") ||
    "https://politeia.co"
  ).replace(/\/$/, "");
}

export function getGoogleClientId(): string | undefined {
  return firstEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
}

export function getGoogleClientSecret(): string | undefined {
  return firstEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getAuthSecret() && getGoogleClientId() && getGoogleClientSecret());
}

export function googleCallbackUrl(origin = getAuthUrl()): string {
  return `${origin.replace(/\/$/, "")}/api/auth/callback/google`;
}
