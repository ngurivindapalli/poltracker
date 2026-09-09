"use client";

import { useState } from "react";
import {
  MEMBER_PHOTO_PLACEHOLDER,
  safeMemberImageUrl,
} from "@/lib/images";

type SenatorImageProps = {
  bioguideId: string;
  imageUrl?: string;
  name: string;
  width?: number;
  height?: number;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function SenatorImage({
  bioguideId,
  imageUrl,
  name,
  width = 160,
  height = 160,
}: SenatorImageProps) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? MEMBER_PHOTO_PLACEHOLDER
    : safeMemberImageUrl(bioguideId, imageUrl, "450x550");

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-border bg-muted"
      style={{ width, height }}
    >
      {failed ? (
        <div
          className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground"
          aria-hidden
        >
          {initials(name)}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          width={width}
          height={height}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
