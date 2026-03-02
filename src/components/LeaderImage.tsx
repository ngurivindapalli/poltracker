"use client";

import { useState } from "react";

interface LeaderImageProps {
  src: string;
  name: string;
  size?: string;
}

export default function LeaderImage({ src, name, size = "w-24 h-24" }: LeaderImageProps) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? "/default-avatar.svg" : src}
      onError={() => setError(true)}
      alt={name}
      className={`${size} rounded-full object-cover border border-[#E2E8F0]`}
    />
  );
}
