/**
 * Centralized Quiver Quantitative HTTP client.
 *
 * Auth: Authorization: Bearer ${QUIVER_API_KEY}
 * Base: QUIVER_BASE_URL || https://api.quiverquant.com/beta
 *
 * Never hard-code API keys. Use .env.local (gitignored).
 */

import {
  QuiverAuthError,
  QuiverError,
  QuiverRateLimitError,
  QuiverSchemaError,
} from "./errors";

export type QuiverClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  logger?: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void;
};

type CacheEntry = { expiresAt: number; value: unknown };

const memoryCache = new Map<string, CacheEntry>();

function defaultLogger(
  level: "info" | "warn" | "error",
  msg: string,
  meta?: Record<string, unknown>
) {
  const line = meta ? `${msg} ${JSON.stringify(meta)}` : msg;
  if (level === "error") console.error(`[quiver] ${line}`);
  else if (level === "warn") console.warn(`[quiver] ${line}`);
  else console.log(`[quiver] ${line}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class QuiverClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly cacheTtlMs: number;
  private log: QuiverClientOptions["logger"];

  constructor(opts: QuiverClientOptions = {}) {
    const apiKey =
      opts.apiKey ??
      process.env.QUIVER_API_KEY ??
      process.env.QUIVER_TOKEN ??
      "";
    if (!apiKey || apiKey.includes("PASTE_YOUR")) {
      throw new QuiverAuthError(
        "QUIVER_API_KEY is not set. Add it to .env.local (see .env.example)."
      );
    }
    this.apiKey = apiKey;
    const rawBase =
      opts.baseUrl ??
      process.env.QUIVER_BASE_URL ??
      "https://api.quiverquant.com/beta";
    this.baseUrl = rawBase.replace(/\/$/, "");
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxRetries = opts.maxRetries ?? 8;
    this.cacheTtlMs = opts.cacheTtlMs ?? 0;
    this.log = opts.logger ?? defaultLogger;
  }

  private url(path: string, query?: Record<string, string | number | undefined>) {
    const p = path.startsWith("/") ? path : `/${path}`;
    const u = new URL(`${this.baseUrl}${p}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
      }
    }
    return u.toString();
  }

  async getJson<T = unknown>(
    path: string,
    opts: {
      query?: Record<string, string | number | undefined>;
      cache?: boolean;
      cacheTtlMs?: number;
      validate?: (data: unknown) => data is T;
      expectArray?: boolean;
      expectObject?: boolean;
    } = {}
  ): Promise<T> {
    const url = this.url(path, opts.query);
    const cacheKey = url;
    const ttl = opts.cacheTtlMs ?? this.cacheTtlMs;
    if (opts.cache !== false && ttl > 0) {
      const hit = memoryCache.get(cacheKey);
      if (hit && hit.expiresAt > Date.now()) {
        return hit.value as T;
      }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        this.log?.("info", "GET", { path, attempt });
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          throw new QuiverAuthError(
            `Quiver auth failed (${res.status}) for ${path}`,
            path
          );
        }
        if (res.status === 429) {
          const backoff = Math.min(60_000, 1500 * 2 ** attempt);
          this.log?.("warn", "rate limited, backing off", { path, backoff, attempt });
          await sleep(backoff);
          lastError = new QuiverRateLimitError(undefined, path);
          // Do not burn remaining attempts without delay — keep retrying until maxRetries
          continue;
        }
        if ([500, 502, 503, 504].includes(res.status)) {
          const backoff = Math.min(30_000, 1000 * 2 ** attempt);
          this.log?.("warn", "server error, retrying", {
            path,
            status: res.status,
            backoff,
          });
          await sleep(backoff);
          lastError = new QuiverError(`Quiver ${res.status}`, {
            status: res.status,
            path,
            retryable: true,
          });
          continue;
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new QuiverError(
            `Quiver HTTP ${res.status} for ${path}: ${body.slice(0, 200)}`,
            { status: res.status, path, retryable: false }
          );
        }

        const text = await res.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (e) {
          throw new QuiverSchemaError(
            `Invalid JSON from ${path}: ${(e as Error).message}`,
            path
          );
        }

        if (opts.expectArray && !Array.isArray(data)) {
          // Some bulk endpoints wrap { data: [] }
          if (
            data &&
            typeof data === "object" &&
            Array.isArray((data as { data?: unknown }).data)
          ) {
            data = (data as { data: unknown[] }).data;
          } else {
            throw new QuiverSchemaError(
              `Expected array response from ${path}`,
              path
            );
          }
        }
        if (opts.expectObject && (data == null || typeof data !== "object" || Array.isArray(data))) {
          throw new QuiverSchemaError(
            `Expected object response from ${path}`,
            path
          );
        }
        if (opts.validate && !opts.validate(data)) {
          throw new QuiverSchemaError(
            `Schema validation failed for ${path}`,
            path
          );
        }

        if (opts.cache !== false && ttl > 0) {
          memoryCache.set(cacheKey, {
            expiresAt: Date.now() + ttl,
            value: data,
          });
        }

        return data as T;
      } catch (e) {
        if (
          e instanceof QuiverAuthError ||
          e instanceof QuiverSchemaError
        ) {
          throw e;
        }
        if (e instanceof QuiverError && !e.retryable) throw e;
        lastError = e;
        if (attempt < this.maxRetries) {
          const backoff = Math.min(30_000, 1000 * 2 ** attempt);
          await sleep(backoff);
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new QuiverError(`Quiver request failed for ${path}`, {
          path,
          cause: lastError,
        });
  }

  /** Paginate Quiver { data, pagination } bulk endpoints. */
  async getPaginatedData<T>(
    path: string,
    opts: {
      query?: Record<string, string | number | undefined>;
      pageSize?: number;
      maxPages?: number;
      itemValidate?: (item: unknown) => boolean;
    } = {}
  ): Promise<T[]> {
    const pageSize = opts.pageSize ?? 500;
    const maxPages = opts.maxPages ?? 100;
    const out: T[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= maxPages) {
      const payload = await this.getJson<{
        data?: T[];
        pagination?: { page?: number; total_pages?: number; total?: number };
      }>(path, {
        query: { ...opts.query, page, page_size: pageSize },
        cache: false,
        expectObject: true,
      });

      const batch = Array.isArray(payload.data) ? payload.data : [];
      for (const item of batch) {
        if (!opts.itemValidate || opts.itemValidate(item)) out.push(item);
      }

      totalPages = payload.pagination?.total_pages ?? page;
      const total = payload.pagination?.total;
      this.log?.("info", "paginated page", {
        path,
        page,
        totalPages,
        total,
        batch: batch.length,
      });
      page += 1;
      if (batch.length === 0) break;
    }

    return out;
  }
}

let singleton: QuiverClient | null = null;

export function getQuiverClient(opts?: QuiverClientOptions): QuiverClient {
  if (opts) return new QuiverClient(opts);
  if (!singleton) singleton = new QuiverClient();
  return singleton;
}
