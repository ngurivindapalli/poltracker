"use client";

import { useState } from "react";
import Link from "next/link";
import type { Leader } from "@/data/globalLeaders";

export default function LeaderCard({ leader }: { leader: Leader }) {
  const [imgSrc, setImgSrc] = useState(leader.image);

  return (
    <Link href={`/global/${leader.slug}`} className="interactive-card block p-5 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc || "/images/placeholder-avatar.svg"}
          alt=""
          onError={() => setImgSrc("/images/placeholder-avatar.svg")}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{leader.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{leader.title}</p>
      <span className="mt-2 inline-block text-xs text-muted-foreground">
        {leader.country}
      </span>
    </Link>
  );
}
