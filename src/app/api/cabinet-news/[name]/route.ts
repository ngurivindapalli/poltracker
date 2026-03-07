import { NextResponse } from "next/server"

const API_KEY = process.env.NEWS_API_KEY

export async function GET(req: Request, { params }: any) {
  const name = decodeURIComponent(params.name)

  const url =
    `https://newsapi.org/v2/everything?q=${name}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${API_KEY}`

  try {
    const res = await fetch(url)

    const data = await res.json()

    const articles = (data.articles || []).map((a:any)=>({
      title: a.title,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt
    }))

    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
