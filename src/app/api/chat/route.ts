export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { allowChatRequest, chatRateLimitKey } from "@/lib/chat/rateLimit";
import { answerChat } from "@/lib/chat/service";
import { chatErrorResponse } from "@/lib/chat/errors";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      chatErrorResponse("invalid", "Send a JSON object with a message."),
      { status: 400 }
    );
  }

  const user = await getSessionUser();
  const key = chatRateLimitKey(req, user?.id);
  if (!allowChatRequest({ key, authenticated: Boolean(user) })) {
    return NextResponse.json(
      chatErrorResponse(
        "rate_limited",
        "Too many questions in a short time. Please wait a minute and try again.",
        true
      ),
      { status: 429 }
    );
  }

  try {
    const result = await answerChat(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json(
      chatErrorResponse(
        "unavailable",
        "The research assistant is temporarily unavailable. Please try again.",
        true
      ),
      { status: 500 }
    );
  }
}
