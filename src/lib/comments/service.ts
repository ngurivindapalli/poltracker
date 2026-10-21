import { getPrisma } from "@/lib/db";
import { sanitizeCommentBody } from "./validation";

export type PublicComment = {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile: {
    username: string | null;
    display_name: string;
    avatar_url: string | null;
  } | null;
  like_count: number;
  liked_by_current_user: boolean;
  replies: PublicComment[];
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function listComments(
  entityType: string,
  entityId: string,
  currentUserId?: string | null
): Promise<PublicComment[]> {
  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  const rows = await prisma.discussionComment.findMany({
    where: { entityType, entityId, deletedAt: null },
    include: {
      author: true,
      likes: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped = new Map<string, PublicComment>();
  for (const row of rows) {
    mapped.set(row.id, {
      id: row.id,
      entity_type: row.entityType,
      entity_id: row.entityId,
      user_id: row.authorId,
      body: row.body,
      parent_id: row.parentId,
      created_at: toIso(row.createdAt),
      updated_at: toIso(row.updatedAt),
      profile: {
        username: null,
        display_name: row.author?.name || "Member",
        avatar_url: row.author?.image || null,
      },
      like_count: row.likes.length,
      liked_by_current_user: currentUserId
        ? row.likes.some((like: { userId: string }) => like.userId === currentUserId)
        : false,
      replies: [],
    });
  }

  const topLevel: PublicComment[] = [];
  for (const comment of mapped.values()) {
    if (comment.parent_id && mapped.has(comment.parent_id)) {
      mapped.get(comment.parent_id)!.replies.push(comment);
    } else {
      topLevel.push(comment);
    }
  }

  topLevel.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return topLevel;
}

export async function createPersistedComment(input: {
  entityType: string;
  entityId: string;
  body: string;
  parentId?: string | null;
  authorId: string;
}) {
  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  if (input.parentId) {
    const parent = await prisma.discussionComment.findFirst({
      where: {
        id: input.parentId,
        entityType: input.entityType,
        entityId: input.entityId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!parent) throw new Error("Parent comment was not found.");
  }

  return prisma.discussionComment.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      body: sanitizeCommentBody(input.body),
      parentId: input.parentId || null,
      authorId: input.authorId,
    },
  });
}

export async function updatePersistedComment(input: {
  commentId: string;
  body: string;
  authorId: string;
}) {
  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  const existing = await prisma.discussionComment.findUnique({
    where: { id: input.commentId },
  });
  if (!existing || existing.deletedAt) throw new Error("Comment not found.");
  if (existing.authorId !== input.authorId) {
    const error = new Error("You can only edit your own comments.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  return prisma.discussionComment.update({
    where: { id: input.commentId },
    data: { body: sanitizeCommentBody(input.body) },
  });
}

export async function deletePersistedComment(input: {
  commentId: string;
  authorId: string;
}) {
  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  const existing = await prisma.discussionComment.findUnique({
    where: { id: input.commentId },
  });
  if (!existing || existing.deletedAt) throw new Error("Comment not found.");
  if (existing.authorId !== input.authorId) {
    const error = new Error("You can only delete your own comments.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }

  await prisma.discussionComment.update({
    where: { id: input.commentId },
    data: { deletedAt: new Date() },
  });
}

export async function togglePersistedCommentLike(input: {
  commentId: string;
  userId: string;
}) {
  const prisma = await getPrisma();
  if (!prisma) throw new Error("Database unavailable.");

  const comment = await prisma.discussionComment.findFirst({
    where: { id: input.commentId, deletedAt: null },
    select: { id: true },
  });
  if (!comment) throw new Error("Comment not found.");

  const existing = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId: input.commentId,
        userId: input.userId,
      },
    },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.commentLike.create({
    data: {
      commentId: input.commentId,
      userId: input.userId,
    },
  });
  return { liked: true };
}
