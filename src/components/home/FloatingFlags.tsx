"use client";

import Link from "next/link";

const flags = [
  {
    name: "US",
    href: "/us",
    src: "/flags/us.png",
    x: "12%",
    y: "18%"
  },
  {
    name: "Germany",
    href: "/germany",
    src: "/flags/germany.png",
    x: "70%",
    y: "22%"
  },
  {
    name: "UK",
    href: "/uk",
    src: "/flags/uk.png",
    x: "15%",
    y: "70%"
  },
  {
    name: "Japan",
    href: "#",
    src: "/flags/japan.png",
    x: "45%",
    y: "40%"
  },
  {
    name: "Australia",
    href: "#",
    src: "/flags/australia.png",
    x: "60%",
    y: "75%"
  },
  {
    name: "Sweden",
    href: "#",
    src: "/flags/sweden.png",
    x: "30%",
    y: "12%"
  },
  {
    name: "India",
    href: "/india",
    src: "/flags/india.png",
    x: "50%",
    y: "60%"
  }
];

export default function FloatingFlags() {
  return (
    <div className="relative h-[360px] w-[480px] rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-inner overflow-hidden">
      {flags.map((flag, i) => (
        <Link
          key={flag.name}
          href={flag.href}
          style={{
            left: flag.x,
            top: flag.y,
            animationDelay: `${i * 0.6}s`
          }}
          className="absolute group animate-float"
        >
          <div className="flex items-center gap-2 rounded-full bg-white/60 backdrop-blur px-3 py-2 shadow-md transition hover:scale-110 hover:shadow-lg">
            <img
              src={flag.src}
              alt={flag.name}
              width={28}
              height={20}
              className="rounded-sm"
              onError={(e) => {
                e.currentTarget.src = "/flags/us.png";
              }}
            />
            <span className="text-sm font-medium text-gray-800">
              {flag.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
