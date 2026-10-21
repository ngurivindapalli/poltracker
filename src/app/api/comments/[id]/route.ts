import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  deletePersistedComment,
  updatePersistedComment,
} from "@/lib/comments/service";
import { validateCommentBody } from "@/lib/comments/validation";

export const runtime = "nodejs";

function errorStatus(error: unknown): number {
  const status = (error as { status?: number }).status;
  if (status) return status;
  const message = error instanceof Error ? error.message : "";
  if (message.includes("unavailable")) return 503;
  if (message.includes("not found")) return 404;
  return 400;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to edit comments." },
      { status: 401 }
    );
  }

  let payload: { body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const body = String(payload.body || "");
  const bodyError = validateCommentBody(body);
  if (bodyError) {
    return NextResponse.json({ error: bodyError }, { status: 400 });
  }

  try {
    await updatePersistedComment({
      commentId: params.id,
      body,
      authorId: user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update comment." },
      { status: errorStatus(error) }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to delete comments." },
      { status: 401 }
    );
  }

  try {
    await deletePersistedComment({
      commentId: params.id,
      authorId: user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete comment." },
      { status: errorStatus(error) }
    );
  }
}
