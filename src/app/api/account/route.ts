import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let payload: { name?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(payload.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json(
      { error: "Display name must be 40 characters or fewer." },
      { status: 400 }
    );
  }

  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const updated = await prisma.appUser.update({
    where: { id: user.id },
    data: { name },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
    },
  });
}
