import { NextResponse } from "next/server";
import { getCountiesForState } from "@/lib/localData/usCounties";

export const revalidate = 86400; // Cache 24 hours - counties are static

export async function GET(
  _req: Request,
  { params }: { params: { stateCode: string } }
) {
  const stateCode = params.stateCode?.toUpperCase();
  if (!stateCode) {
    return NextResponse.json({ counties: [] }, { status: 400 });
  }
  const counties = getCountiesForState(stateCode);
  return NextResponse.json({ counties });
}
