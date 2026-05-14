import Link from "next/link";
import { notFound } from "next/navigation";
import { getGovernorBySlug } from "@/data/governorsByState";
import { GovernorNewsBlock } from "@/components/news/GovernorNewsBlock";

export default async function GovernorPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const governor = getGovernorBySlug(slug);
  if (!governor) return notFound();

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

      <GovernorNewsBlock slug={slug} />
    </div>
  );
}
