import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { allowChatRequest, chatRateLimitKey } from "@/lib/chat/rateLimit";
import { answerChat } from "@/lib/chat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legacy Ask Politeia endpoint. Delegates to the same Groq-backed chat service.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { reply: "Send a JSON object with a message." },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last =
    typeof body.message === "string"
      ? body.message
      : String(messages[messages.length - 1]?.content || "");
  const history = messages.slice(0, -1).map((item: { role?: unknown; content?: unknown }) => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: String(item?.content || ""),
  }));

  const user = await getSessionUser();
  const key = chatRateLimitKey(req, user?.id);
  if (!allowChatRequest({ key, authenticated: Boolean(user) })) {
    return NextResponse.json(
      {
        reply:
          "Too many questions in a short time. Please wait a minute and try again.",
      },
      { status: 429 }
    );
  }

  const result = await answerChat({
    message: last,
    bioguideId: body.bioguideId,
    state: body.state,
    history,
  });
  return NextResponse.json(
    { reply: result.body.answer, ...result.body },
    { status: result.status }
  );
}
