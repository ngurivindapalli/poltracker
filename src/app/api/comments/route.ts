import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { allowCommentWrite } from "@/lib/comments/rateLimit";
import { createPersistedComment, listComments } from "@/lib/comments/service";
import {
  validateCommentBody,
  validateEntityKey,
} from "@/lib/comments/validation";

export const runtime = "nodejs";

function errorStatus(error: unknown): number {
  const status = (error as { status?: number }).status;
  if (status) return status;
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("unavailable") ||
    message.includes("does not exist") ||
    message.includes("relation")
  ) {
    return 503;
  }
  return 400;
}

export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get("entityType") || "";
  const entityId = req.nextUrl.searchParams.get("entityId") || "";
  const typeError = validateEntityKey(entityType, "Discussion");
  const idError = validateEntityKey(entityId, "Discussion");
  if (typeError || idError) {
    return NextResponse.json(
      { error: typeError || idError },
      { status: 400 }
    );
  }

  try {
    const user = await getSessionUser();
    const comments = await listComments(entityType, entityId, user?.id);
    const count = countComments(comments);
    return NextResponse.json({ comments, count });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load comments." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to join the discussion." },
      { status: 401 }
    );
  }
  if (!allowCommentWrite(user.id)) {
    return NextResponse.json(
      { error: "Please wait a moment before posting again." },
      { status: 429 }
    );
  }

  let payload: {
    entityType?: string;
    entityId?: string;
    body?: string;
    parentId?: string | null;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const entityType = String(payload.entityType || "");
  const entityId = String(payload.entityId || "");
  const body = String(payload.body || "");
  const parentId = payload.parentId ? String(payload.parentId) : null;

  const typeError = validateEntityKey(entityType, "Discussion");
  const idError = validateEntityKey(entityId, "Discussion");
  const bodyError = validateCommentBody(body);
  if (typeError || idError || bodyError) {
    return NextResponse.json(
      { error: typeError || idError || bodyError },
      { status: 400 }
    );
  }

  try {
    await createPersistedComment({
      entityType,
      entityId,
      body,
      parentId,
      authorId: user.id,
    });
    const comments = await listComments(entityType, entityId, user.id);
    return NextResponse.json({ comments, count: countComments(comments) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post comment." },
      { status: errorStatus(error) }
    );
  }
}

function countComments(
  comments: Array<{ replies: unknown[] }>
): number {
  return comments.reduce((sum, comment) => {
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    return sum + 1 + countComments(replies as Array<{ replies: unknown[] }>);
  }, 0);
}
