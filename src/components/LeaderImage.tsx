"use client";

import { useState } from "react";

interface LeaderImageProps {
  src: string;
  name: string;
  size?: string;
}

// Generate initials from name for fallback
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LeaderImage({ src, name, size = "w-24 h-24" }: LeaderImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    // Show initials avatar as fallback
    return (
      <div 
        className={`${size} rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center border-2 border-[#E2E8F0]`}
      >
        <span className="text-white font-bold text-lg">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      onError={() => setError(true)}
      alt={name}
      className={`${size} rounded-full object-cover border-2 border-[#E2E8F0]`}
    />
  );
}
