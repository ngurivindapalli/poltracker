"use client";

import { useState } from "react";

type SenatorImageProps = {
  bioguideId: string;
  imageUrl?: string;
  name: string;
  width?: number;
  height?: number;
};

export default function SenatorImage({
  bioguideId,
  imageUrl,
  name,
  width = 160,
  height = 160,
}: SenatorImageProps) {
  const [imgSrc, setImgSrc] = useState(imageUrl || getImageUrl(bioguideId));

  function getImageUrl(id: string) {
    if (!id) return "/images/placeholder-avatar.svg";
    const firstLetter = id[0]?.toUpperCase() || "A";
    return `https://bioguide.congress.gov/bioguide/photo/${firstLetter}/${id}.jpg`;
  }

  return (
    <img
      src={imgSrc}
      alt={name}
      width={width}
      height={height}
      className="shrink-0 rounded-full border border-border object-cover"
      onError={() => setImgSrc("/images/placeholder-avatar.svg")}
    />
  );
}
