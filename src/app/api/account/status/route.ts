import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/auth/env";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ google: isGoogleAuthConfigured() });
}
