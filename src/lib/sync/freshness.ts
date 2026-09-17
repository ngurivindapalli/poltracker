import { getPrisma } from "@/lib/db";

export async function recordDatasetFreshness(input: {
  dataset: string;
  status: "running" | "success" | "failed" | "partial";
  recordCount?: number;
  error?: string | null;
  successful?: boolean;
}) {
  const prisma = await getPrisma();
  if (!prisma?.datasetFreshness) return;

  const now = new Date();
  const existing = await prisma.datasetFreshness
    .findUnique({ where: { dataset: input.dataset } })
    .catch(() => null);

  const lastSuccessfulSync =
    input.successful || input.status === "success" || input.status === "partial"
      ? now
      : existing?.lastSuccessfulSync ?? null;

  await prisma.datasetFreshness.upsert({
    where: { dataset: input.dataset },
    create: {
      dataset: input.dataset,
      status: input.status,
      lastSuccessfulSync,
      lastAttemptAt: now,
      recordCount: input.recordCount ?? 0,
      error: input.error ?? null,
    },
    update: {
      status: input.status,
      lastAttemptAt: now,
      recordCount: input.recordCount ?? existing?.recordCount ?? 0,
      error: input.error ?? null,
      lastSuccessfulSync,
    },
  });
}

export async function getDatasetFreshness(dataset: string): Promise<{
  dataset: string;
  status: string;
  lastSuccessfulSync: string | null;
  lastAttemptAt: string | null;
  recordCount: number;
} | null> {
  const prisma = await getPrisma();
  if (!prisma?.datasetFreshness) return null;
  try {
    const row = await prisma.datasetFreshness.findUnique({
      where: { dataset },
    });
    if (!row) return null;
    return {
      dataset: row.dataset,
      status: row.status,
      lastSuccessfulSync: row.lastSuccessfulSync
        ? row.lastSuccessfulSync.toISOString()
        : null,
      lastAttemptAt: row.lastAttemptAt
        ? row.lastAttemptAt.toISOString()
        : null,
      recordCount: row.recordCount ?? 0,
    };
  } catch {
    return null;
  }
}
