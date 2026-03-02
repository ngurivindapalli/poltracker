"use client"

import { getGermanyMember } from "@/lib/germany/members"
import GermanyProfileLayout from "@/components/germany/GermanyProfileLayout"
import BackButton from "@/components/BackButton"

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
    </>
  )
}
