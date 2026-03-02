"use client";

import { useEffect, useMemo, useRef } from "react";

type FlagParticle = {
  id: string;
  src: string;
  x: number;      // 0..1
  y: number;      // 0..1 (can start negative)
  speed: number;  // fraction per second
  size: number;   // px
  rot: number;    // deg
  rotSpeed: number; // deg/sec
  opacity: number;
  blur: number;
  z: number;
};

const FLAG_URLS = [
  "https://flagcdn.com/w320/us.png",
  "https://flagcdn.com/w320/de.png",
  "https://flagcdn.com/w320/gb.png",
  "https://flagcdn.com/w320/fr.png",
  "https://flagcdn.com/w320/it.png",
  "https://flagcdn.com/w320/es.png",
  "https://flagcdn.com/w320/ca.png",
  "https://flagcdn.com/w320/jp.png",
  "https://flagcdn.com/w320/kr.png",
  "https://flagcdn.com/w320/br.png",
  "https://flagcdn.com/w320/in.png",
  "https://flagcdn.com/w320/au.png",
  "https://flagcdn.com/w320/se.png",
  "https://flagcdn.com/w320/no.png",
  "https://flagcdn.com/w320/nl.png",
  "https://flagcdn.com/w320/ch.png",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FallingFlagsLayer({
  count = 18,
}: {
  count?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const initial = useMemo<FlagParticle[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = rand(84, 170);
      const depth = rand(0, 1); // depth -> opacity/blur/speed
      return {
        id: `flag-${i}-${Math.random().toString(16).slice(2)}`,
        src: pick(FLAG_URLS),
        x: rand(0.05, 0.95),
        y: rand(-0.8, 0.8),
        speed: rand(0.02, 0.065) * (0.65 + depth), // slower overall
        size,
        rot: rand(-8, 8),
        rotSpeed: rand(-6, 6),
        opacity: 0.35 + depth * 0.55,
        blur: (1 - depth) * 1.6,
        z: Math.floor(depth * 10),
      };
    });
  }, [count]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // store mutable state on DOM to avoid rerenders
    const particles: FlagParticle[] = initial.map((p) => ({ ...p }));

    // create DOM nodes
    el.innerHTML = "";
    const nodes = particles.map((p) => {
      const n = document.createElement("div");
      n.className = "flagFloat";
      n.style.width = `${p.size}px`;
      n.style.height = `${Math.round(p.size * 0.66)}px`;
      n.style.opacity = `${p.opacity}`;
      n.style.filter = `blur(${p.blur}px)`;
      n.style.zIndex = `${p.z}`;

      const img = document.createElement("img");
      img.src = p.src;
      img.alt = "flag";
      img.loading = "lazy";
      n.appendChild(img);

      el.appendChild(n);
      return n;
    });

    let raf = 0;
    let last = performance.now();

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      // container size
      const rect = el.getBoundingClientRect();
      const W = rect.width || 1;
      const H = rect.height || 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // drift downward
        p.y += p.speed * dt;

        // tiny x drift (subtle)
        p.x += Math.sin((t / 1000) * 0.4 + i) * 0.00015;

        // rotate slowly
        p.rot += p.rotSpeed * dt;

        // loop when below bottom
        if (p.y > 1.25) {
          p.y = rand(-0.35, -0.15);
          p.x = rand(0.05, 0.95);
          p.src = pick(FLAG_URLS);

          // refresh image sometimes
          const img = nodes[i].querySelector("img") as HTMLImageElement;
          img.src = p.src;
        }

        const xPx = p.x * W - p.size / 2;
        const yPx = p.y * H - (p.size * 0.66) / 2;

        nodes[i].style.transform = `translate3d(${xPx}px, ${yPx}px, 0) rotate(${p.rot}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [initial]);

  return <div ref={ref} className="fallingFlags" aria-hidden="true" />;
}
