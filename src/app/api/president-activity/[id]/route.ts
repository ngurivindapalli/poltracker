import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (params.id !== "trump" && params.id !== "donald-trump") {
    return NextResponse.json([]);
  }

  const url =
    "https://www.federalregister.gov/api/v1/documents.json?conditions[president]=donald-trump&per_page=20&order=newest";

  try {
    const res = await fetch(url, {
      cache: "no-store"
    });

    const json = await res.json();

    return NextResponse.json(json.results || []);

  } catch (e) {
    console.error("President activity error:", e);
    return NextResponse.json([]);
  }
}
