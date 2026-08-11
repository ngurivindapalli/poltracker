/**
 * Optional Prisma access for Quiver warehouse upserts.
 * Fails soft when DATABASE_URL/client/tables unavailable so runtime/sync stays JSON-first.
 */

let prismaPromise: Promise<any | null> | null = null;

export async function getPrismaOptional(): Promise<any | null> {
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
        const client = new PrismaClient({ adapter });
        // Probe that quiver tables exist; otherwise skip DB writes silently.
        try {
          await client.$queryRaw`SELECT 1 FROM congress_trades LIMIT 0`;
        } catch {
          console.warn(
            "[quiver] DB connected but quiver tables missing — run prisma migrate deploy. Using JSON cache only."
          );
          try {
            await client.$disconnect();
          } catch {
            /* ignore */
          }
          return null;
        }
        return client;
      } catch (e) {
        console.warn(
          "[quiver] Prisma unavailable (JSON cache only):",
          (e as Error).message
        );
        return null;
      }
    })();
  }
  return prismaPromise;
}
