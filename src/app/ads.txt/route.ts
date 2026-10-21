import { NextResponse } from "next/server";
import { adsTxtBody } from "@/lib/ads/config";

export function GET() {
  const body = adsTxtBody();
  if (!body) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
