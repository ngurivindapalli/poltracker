import { NextResponse } from "next/server";
import {
  CongressApiError,
  fetchCosponsoredLegislation,
  fetchSponsoredLegislation,
} from "@/lib/congress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractBillList(data: unknown, primaryKey: string): any[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, any>;
  const candidates = [
    record[primaryKey],
    record[primaryKey]?.item,
    record.bills,
    record.bills?.item,
  ];
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function cleanBills(bills: any[]) {
  if (!Array.isArray(bills)) return [];
  return bills
    .filter((b) => b && (b.number || b.billNumber) && (b.type || b.billType))
    .map((b) => {
      const number = String(b.number ?? b.billNumber);
      const type = String(b.type ?? b.billType);
      const title =
        b.titles?.[0]?.title ||
        b.title ||
        `${type.toUpperCase()} ${number}`;
      return {
        number,
        type,
        congress: b.congress ?? null,
        title,
        latestAction: b.latestAction?.text || null,
      };
    });
}

function settledError(result: PromiseSettledResult<unknown>): string | null {
  if (result.status !== "rejected") return null;
  const reason = result.reason;
  if (reason instanceof CongressApiError) {
    return `${reason.status}`;
  }
  return "error";
}

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguide = params.bioguideId;

  if (!process.env.API_DATA_GOV_KEY) {
    console.info(
      `Congress legislation request: member=${bioguide} status=unconfigured items=0`
    );
    return NextResponse.json({
      sponsored: [],
      cosponsored: [],
      status: "unconfigured",
    });
  }

  try {
    const [sponsoredResult, cosponsoredResult] = await Promise.allSettled([
      fetchSponsoredLegislation(bioguide, 20),
      fetchCosponsoredLegislation(bioguide, 20),
    ]);

    const sponsored =
      sponsoredResult.status === "fulfilled"
        ? cleanBills(
            extractBillList(sponsoredResult.value, "sponsoredLegislation")
          )
        : [];
    const cosponsored =
      cosponsoredResult.status === "fulfilled"
        ? cleanBills(
            extractBillList(cosponsoredResult.value, "cosponsoredLegislation")
          )
        : [];

    const sponsoredErr = settledError(sponsoredResult);
    const cosponsoredErr = settledError(cosponsoredResult);
    const failed = Boolean(sponsoredErr && cosponsoredErr);
    const status = failed ? "error" : "ok";

    console.info(
      `Congress legislation request: member=${bioguide} status=${status} sponsored=${sponsored.length} cosponsored=${cosponsored.length}${
        sponsoredErr ? ` sponsoredError=${sponsoredErr}` : ""
      }${cosponsoredErr ? ` cosponsoredError=${cosponsoredErr}` : ""}`
    );

    return NextResponse.json({
      sponsored,
      cosponsored,
      status,
    });
  } catch (err) {
    const kind =
      err instanceof CongressApiError ? String(err.status) : "error";
    console.info(
      `Congress legislation request: member=${bioguide} status=${kind} items=0`
    );
    return NextResponse.json({
      sponsored: [],
      cosponsored: [],
      status: "error",
    });
  }
}
