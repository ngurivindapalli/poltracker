import { NextResponse } from "next/server";
import {
  buildOverviewContext,
  fallbackOverview,
} from "@/lib/ai/politicianOverview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new Map<string, { summary: string; generatedAt: string; source: string }>();

export async function POST(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const ctx = await buildOverviewContext(params.bioguideId);
  if (!ctx) {
    return NextResponse.json(
      { error: "Member records were not found." },
      { status: 404 }
    );
  }

  const cached = cache.get(ctx.fingerprint);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const summary = fallbackOverview(ctx);
    const payload = {
      summary,
      generatedAt: new Date().toISOString(),
      source: "records",
      cached: false,
    };
    cache.set(ctx.fingerprint, payload);
    return NextResponse.json(payload);
  }

  const prompt = `Write a factual overview of this politician using ONLY the JSON below.
Do not infer motives, ideology, effectiveness, or future outcomes.
Do not rank, score, endorse, or recommend.
If a field is null or a list is empty, say that information is unavailable.
Do not use markdown headings with # or **.
Use these plain labels on their own lines: At a glance, Legislative activity, Financial activity, Recent coverage, Key data points, Data sources.
Keep it readable in under two minutes.

${JSON.stringify(ctx)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You summarize stored Politeia records. You never browse the web and never invent facts.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const summary = fallbackOverview(ctx);
      return NextResponse.json({
        summary,
        generatedAt: new Date().toISOString(),
        source: "records",
        cached: false,
        notice: "AI generation was unavailable. Showing a record-based summary.",
      });
    }

    const data = await response.json();
    const summary =
      data.choices?.[0]?.message?.content || fallbackOverview(ctx);
    const payload = {
      summary,
      generatedAt: new Date().toISOString(),
      source: "openai",
      cached: false,
    };
    cache.set(ctx.fingerprint, payload);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      summary: fallbackOverview(ctx),
      generatedAt: new Date().toISOString(),
      source: "records",
      cached: false,
      notice: "AI generation timed out or failed. Showing a record-based summary.",
    });
  }
}
