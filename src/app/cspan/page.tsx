import CspanSchedule from "@/components/home/CspanSchedule";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import Link from "next/link";

export default function CspanPage() {
  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <PageHeader 
        title="C-SPAN Schedule" 
        subtitle="Congressional sessions, hearings, and public affairs programming."
      />

      <Section>
        <CspanSchedule />
      </Section>
    </main>
  );
}
