import { getLeaderAssets } from "@/lib/services/globalAssetsService";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { leader: string } }
) {
  const leaderId = params.leader ?? "";
  const data = await getLeaderAssets(leaderId);
  return NextResponse.json(data);
}
