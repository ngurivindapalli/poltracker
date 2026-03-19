export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!process.env.NEWS_API_KEY) {
    return Response.json([]);
  }

  const name = slug.replace(/-/g, " ");

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(name)}&apiKey=${process.env.NEWS_API_KEY}&sortBy=publishedAt&pageSize=10`
    );

    const data = await res.json();
    const articles = Array.isArray(data.articles) ? data.articles : [];

    return Response.json(articles.slice(0, 5));
  } catch {
    return Response.json([]);
  }
}
