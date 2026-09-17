/**
 * Shared Prisma client for request-time and sync jobs.
 * Returns null when DATABASE_URL is missing — callers must fall back.
 */
let prismaPromise: Promise<any | null> | null = null;

export async function getPrisma(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (process.env.QUIVER_SKIP_DB === "1") return null;

  if (!prismaPromise) {
    prismaPromise = (async () => {
      try {
        const { PrismaPg } = await import("@prisma/adapter-pg");
        const { PrismaClient } = await import("@/generated/prisma/client");
        const adapter = new PrismaPg({
          connectionString: process.env.DATABASE_URL!,
        });
        return new PrismaClient({ adapter });
      } catch (e) {
        console.warn("[db] Prisma unavailable:", (e as Error).message);
        return null;
      }
    })();
  }
  return prismaPromise;
}
