import { NextResponse } from "next/server";
import leaders from "@/data/global-leaders.json";

interface Leader {
  id: string;
  name: string;
  title: string;
  country: string;
  party: string;
  image: string;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const leader = leaders.find((l: Leader) => l.id === params.id);

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
