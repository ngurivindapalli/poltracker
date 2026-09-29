export function fecApiKey(): string | null {
  const key = process.env.FEC_API_KEY || process.env.API_DATA_GOV_KEY || "";
  return key.trim() || null;
}
