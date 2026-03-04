import { getBaseUrl } from "@/lib/baseUrl";
import SenatorsList from "@/components/SenatorsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import Link from "next/link";

// Force dynamic rendering so senators are fetched at request time
export const dynamic = 'force-dynamic'

async function getSenators() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/senators`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error("Failed to fetch senators - status:", res.status);
      return [];
    }
    const data = await res.json();
    console.log("Loaded Senators:", data.senators?.length || 0);
    return data.senators || [];
  } catch (e) {
    console.error("Failed to fetch senators", e);
    return [];
  }
}

export default async function SenatorsPage() {
  const senators = await getSenators();

  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <PageHeader 
        title="U.S. Senate" 
        subtitle="Complete directory of current United States Senators with financial disclosures, voting records, and donor networks."
      />

      <Section>
        <SenatorsList senators={senators} />
      </Section>
    </main>
  );
}
