import { NextResponse } from "next/server";
import dataset from "@/data/portfolio-history.json";

type Point = { year: number; value: number };

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const id = params.bioguideId;

  // dataset is an object keyed by bioguideId -> Point[]
  const raw = (dataset as Record<string, any>)[id];

  const arr: Point[] = Array.isArray(raw)
    ? raw
        .map((p: any) => ({
          year: Number(p?.year),
          value: Number(p?.value),
        }))
        .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
        .sort((a, b) => a.year - b.year)
    : [];

  return NextResponse.json(arr);
}
