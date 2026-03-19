import Link from "next/link";
import { notFound } from "next/navigation";
import { MAYORS } from "@/data/mayors";
import { getMayorImage } from "@/lib/getMayorImage";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default async function MayorPage({
  params,
}: {
  params: { slug: string };
}) {
  const mayor = MAYORS.find((m) => m.slug === params.slug);

  if (!mayor) return notFound();

  let news: any[] = [];
  try {
    const base = getBaseUrl();
    const res = await fetch(
      `${base}/api/mayor-news/${mayor.slug}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    news = Array.isArray(data) ? data : data?.articles ?? [];
  } catch {
    news = [];
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href="/us/mayors"
        className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Mayors
      </Link>

      <div className="flex gap-6 mb-10">
        <img
          src={getMayorImage(mayor.name)}
          alt={`${mayor.name}, Mayor of ${mayor.city}`}
          className="w-48 h-48 rounded-lg object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold">{mayor.name}</h1>
          <p className="text-gray-600 mt-1">
            Mayor of {mayor.city}, {mayor.state}
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Latest News</h2>

      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-[#64748B] italic">No recent news available.</p>
        ) : (
          news.slice(0, 10).map((article: any, i: number) => (
            <a
              key={article?.url || i}
              href={article?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-b border-[#E2E8F0] py-3 hover:text-blue-600 transition-colors"
            >
              {article?.title || "Untitled"}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
