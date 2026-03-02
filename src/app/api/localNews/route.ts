import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const county = searchParams.get("county");

  if (!state || !county) {
    return NextResponse.json(
      { error: "Missing state or county parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { articles: [], error: "News API key not configured" },
      { status: 200 }
    );
  }

  try {
    // Build search query for local government news
    const query = encodeURIComponent(`${county} ${state} government OR politics OR election`);
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error("News API error:", response.status);
      return NextResponse.json({ articles: [] });
    }

    const data = await response.json();
    
    const articles = (data.articles || []).map((article: any) => ({
      title: article.title || "Untitled",
      description: article.description || "",
      source: article.source?.name || "Unknown",
      url: article.url || "#",
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || new Date().toISOString()
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Local news fetch error:", error);
    return NextResponse.json({ articles: [] });
  }
}
