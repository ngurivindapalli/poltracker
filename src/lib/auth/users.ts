import { getPrisma } from "@/lib/db";

export type GoogleProfileInput = {
  sub?: string | null;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  email_verified?: boolean | string | null;
};

function emailVerified(profile: GoogleProfileInput): boolean {
  return profile.email_verified === true || profile.email_verified === "true";
}

export async function upsertAppUserFromGoogle(profile: GoogleProfileInput) {
  const sub = profile.sub?.trim();
  if (!sub) throw new Error("Missing Google account identifier.");

  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  const verifiedEmail = emailVerified(profile) ? profile.email?.trim() || null : null;
  const name = profile.name?.trim() || "Member";
  const image = profile.picture?.trim() || null;

  const existing = await prisma.appUser.findUnique({
    where: { googleSub: sub },
  });

  if (existing) {
    return prisma.appUser.update({
      where: { id: existing.id },
      data: {
        name,
        image,
        ...(verifiedEmail && !existing.email ? { email: verifiedEmail } : {}),
      },
    });
  }

  try {
    return await prisma.appUser.create({
      data: {
        googleSub: sub,
        email: verifiedEmail,
        name,
        image,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (verifiedEmail && /unique/i.test(message)) {
      return prisma.appUser.create({
        data: {
          googleSub: sub,
          name,
          image,
        },
      });
    }
    throw error;
  }
}

export async function getAppUserById(id: string) {
  const prisma = await getPrisma();
  if (!prisma) return null;
  return prisma.appUser.findUnique({ where: { id } });
}
