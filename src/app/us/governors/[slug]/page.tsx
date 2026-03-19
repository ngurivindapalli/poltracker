import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { getGovernorBySlug } from "@/data/governorsByState";

export default async function GovernorPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const governor = getGovernorBySlug(slug);
  if (!governor) return notFound();

  const base = getBaseUrl();
  let news: any[] = [];

  try {
    const res = await fetch(`${base}/api/governor-news/${slug}`, {
      cache: "no-store",
    });
    news = await res.json();
    if (!Array.isArray(news)) news = [];
  } catch {
    news = [];
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href="/"
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
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6">{governor.name}</h1>

      <p className="text-[#64748B] mb-8">State Governor</p>

      <h2 className="text-xl font-semibold mb-4">Latest News</h2>

      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-[#64748B] italic">No recent news available.</p>
        ) : (
          news.map((article: any, i: number) => (
            <div
              key={article?.url || i}
              className="border border-[#E2E8F0] p-4 rounded-lg hover:border-[#2563EB] transition-colors"
            >
              <a
                href={article?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3 className="font-semibold text-[#1E3A5F] hover:text-[#2563EB]">
                  {article?.title || "Untitled"}
                </h3>
                {article?.source?.name && (
                  <p className="text-sm text-[#64748B] mt-1">
                    {article.source.name}
                  </p>
                )}
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
