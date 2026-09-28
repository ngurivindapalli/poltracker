const USER_AGENT = "Politeia/1.0 (https://politeia.co; local-election-sync)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of ["api_key", "apikey", "key", "token", "access_token"]) {
      if (u.searchParams.has(key)) u.searchParams.set(key, "REDACTED");
    }
    return u.toString();
  } catch {
    return url.replace(/api_key=[^&]+/gi, "api_key=REDACTED");
  }
}

export async function fetchOfficialText(
  url: string,
  options: { timeoutMs?: number; accept?: string } = {}
): Promise<{ ok: true; text: string; status: number } | { ok: false; status: number; error: string }> {
  const timeoutMs = options.timeoutMs ?? 15000;
  let lastError = "request failed";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": USER_AGENT,
          Accept: options.accept || "text/plain, application/json, */*",
        },
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        await sleep(500 * attempt);
        continue;
      }
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: `HTTP ${res.status} for ${redactUrl(url)}`,
        };
      }
      return { ok: true, text: await res.text(), status: res.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      await sleep(400 * attempt);
    }
  }
  return { ok: false, status: 0, error: `${lastError} (${redactUrl(url)})` };
}

export async function fetchOfficialJson<T>(
  url: string,
  options: { timeoutMs?: number } = {}
): Promise<{ ok: true; data: T; status: number } | { ok: false; status: number; error: string }> {
  const result = await fetchOfficialText(url, {
    ...options,
    accept: "application/json",
  });
  if (result.ok === false) return result;
  try {
    return { ok: true, data: JSON.parse(result.text) as T, status: result.status };
  } catch {
    return { ok: false, status: result.status, error: `Invalid JSON from ${redactUrl(url)}` };
  }
}
