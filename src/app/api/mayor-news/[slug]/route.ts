import { MAYORS } from "@/data/mayors";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const mayor = MAYORS.find((m) => m.slug === slug);
  if (!mayor || !process.env.NEWS_API_KEY) {
    return Response.json([]);
  }

  try {
    const query = encodeURIComponent(`${mayor.name} ${mayor.city}`);
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&apiKey=${process.env.NEWS_API_KEY}&sortBy=publishedAt&pageSize=10`
    );
    const data = await res.json();
    const articles = Array.isArray(data.articles) ? data.articles : [];

    return Response.json(articles.slice(0, 10));
  } catch {
    return Response.json([]);
  }
}
