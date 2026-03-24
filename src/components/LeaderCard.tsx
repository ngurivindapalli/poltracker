"use client";

import { useState } from "react";
import Link from "next/link";
import type { Leader } from "@/data/globalLeaders";

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const [imgSrc, setImgSrc] = useState(leader.image);

  return (
    <Link href={`/global/${leader.slug}`}>
      <div className="card text-center hover:shadow-elevated transition">
        <div className="w-24 h-24 mb-4 mx-auto rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-card">
          <img
            src={imgSrc || "/images/placeholder-avatar.svg"}
            alt={leader.name}
            onError={() => setImgSrc("/images/placeholder-avatar.svg")}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <h3 className="text-lg font-semibold text-foreground">{leader.name}</h3>

        <p className="text-sm text-muted-foreground">{leader.title}</p>

        <span className="mt-2 inline-block px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
          {leader.country}
        </span>
      </div>
    </Link>
  );
}
