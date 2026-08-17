/**
 * Public donation destinations. Do not invent provider usernames or URLs.
 * Venmo stays unset until a real profile URL is configured.
 */
export const DONATION_LINKS = {
  buyMeACoffee: "https://buymeacoffee.com/politeia.co",
  venmo: process.env.NEXT_PUBLIC_VENMO_URL || "",
} as const;

export const VENMO_AVAILABLE = Boolean(DONATION_LINKS.venmo);
