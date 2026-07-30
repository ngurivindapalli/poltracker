"use client"

import { getGermanyMember } from "@/lib/germany/members"
import GermanyProfileLayout from "@/components/germany/GermanyProfileLayout"
import BackButton from "@/components/BackButton"
import { CommentSection } from "@/components/comments/CommentSection"

export default function MemberPage({ params }: { params: { id: string } }) {
  const member = getGermanyMember(params.id)

  if (!member) {
    return (
      <div className="container">
        <BackButton />
        <div style={{ padding: "2rem", textAlign: "center" }}>
          Member not found
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container">
        <BackButton />
      </div>
      <GermanyProfileLayout member={member} />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <CommentSection
          entityType="politician"
          entityId={params.id}
          title="Community Discussion"
        />
      </div>
    </>
  )
}
