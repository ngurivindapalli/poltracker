export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getMemberProfile } from "@/lib/congress";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const profile = await getMemberProfile(params.bioguideId);
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
