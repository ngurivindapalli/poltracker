import { NextResponse } from "next/server";
import { GLOBAL_LEADERS } from "@/data/globalLeaders";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const leader = GLOBAL_LEADERS.find((l) => l.slug === params.id);

  if (!leader) {
    return NextResponse.json([]);
  }

  const NEWS_KEY = process.env.NEWS_API_KEY;

  const query = encodeURIComponent(leader.name);

  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=12&language=en&apiKey=${NEWS_KEY}`;

  try {
    const res = await fetch(url, {
      cache: "no-store"
    });

    const json = await res.json();

    return NextResponse.json(json.articles || []);

  } catch (e) {
    console.error("Leader news error:", e);
    return NextResponse.json([]);
  }
}
