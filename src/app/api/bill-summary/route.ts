import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { title, action } = body;

  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  const prompt = `
Summarize this US Congress bill in 3 concise sentences.

Bill Title:
${title}

Latest Action:
${action}

Explain:

• What the bill does
• Who it affects
• Why it matters

Use plain English.
`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    return NextResponse.json({
      summary: data.choices?.[0]?.message?.content || "Unable to generate summary."
    });

  } catch (e) {
    console.error("OpenAI Error:", e);
    return NextResponse.json({
      summary: "Failed to generate summary."
    });
  }
}
