"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ID_TO_SLUG: Record<string, string> = {
  trump: "donald-trump",
  starmer: "keir-starmer",
  scholz: "olaf-scholz",
  modi: "narendra-modi",
  macron: "emmanuel-macron",
  trudeau: "mark-carney",
};

export default function LeaderRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const slug = ID_TO_SLUG[params.id];

  useEffect(() => {
    if (slug) {
      router.replace(`/global/${slug}`);
    } else {
      router.replace("/");
    }
  }, [slug, router]);

  return null;
}
