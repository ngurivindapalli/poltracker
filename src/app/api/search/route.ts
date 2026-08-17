import { NextResponse } from "next/server";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import { representatives } from "@/data/representatives";
import { GLOBAL_LEADERS } from "@/data/globalLeaders";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { STATIC_SEARCH_HITS, type SearchHit } from "@/lib/search/catalog";

export const runtime = "nodejs";
export const revalidate = 600;

function score(q: string, ...fields: Array<string | null | undefined>) {
  const n = q.toLowerCase().trim();
  if (!n) return 0;
  let best = 0;
  for (const f of fields) {
    const t = (f || "").toLowerCase();
    if (!t) continue;
    if (t === n) best = Math.max(best, 100);
    else if (t.startsWith(n)) best = Math.max(best, 80);
    else if (t.includes(n)) best = Math.max(best, 50);
    else {
      const toks = n.split(/\s+/).filter(Boolean);
      if (toks.length && toks.every((tok) => t.includes(tok))) best = Math.max(best, 40);
    }
  }
  return best;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 1) {
    return NextResponse.json({
      query: q,
      results: STATIC_SEARCH_HITS.slice(0, 8),
    });
  }

  const hits: Array<SearchHit & { score: number }> = [];

  for (const h of STATIC_SEARCH_HITS) {
    const s = score(q, h.title, h.subtitle, h.href);
    if (s) hits.push({ ...h, score: s });
  }

  const { senators } = await getSenatorSummaries();
  for (const s of senators) {
    const sc = score(q, s.name, s.state, s.party, s.bioguideId);
    if (sc) {
      hits.push({
        id: `sen-${s.bioguideId}`,
        title: s.name,
        subtitle: `U.S. Senator · ${s.state || "—"}`,
        href: `/senator/${s.bioguideId}`,
        group: "People",
        score: sc + 10,
      });
    }
  }

  for (const r of representatives) {
    const sc = score(q, r.name, r.state, String(r.district), r.bioguideId);
    if (sc) {
      hits.push({
        id: `rep-${r.bioguideId}`,
        title: r.name,
        subtitle: `U.S. Representative · ${r.state} ${r.district ? `· ${r.district}` : ""}`,
        href: `/representatives/${r.bioguideId}`,
        group: "People",
        score: sc,
      });
    }
  }

  for (const l of GLOBAL_LEADERS) {
    const sc = score(q, l.name, l.title, l.country);
    if (sc) {
      hits.push({
        id: `gl-${l.slug}`,
        title: l.name,
        subtitle: `${l.title} · ${l.country}`,
        href: `/global/${l.slug}`,
        group: "People",
        score: sc + 5,
      });
    }
  }

  for (const [code, name] of Object.entries(STATE_CODE_TO_NAME)) {
    const sc = score(q, code, name);
    if (sc) {
      hits.push({
        id: `st-${code}`,
        title: name,
        subtitle: `U.S. state · ${code}`,
        href: `/state/${code}`,
        group: "States",
        score: sc,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const results: SearchHit[] = [];
  for (const h of hits) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    results.push({
      id: h.id,
      title: h.title,
      subtitle: h.subtitle,
      href: h.href,
      group: h.group,
    });
    if (results.length >= 24) break;
  }

  return NextResponse.json({ query: q, results });
}
