// Comment model + storage helpers for the localStorage prototype.
//
// Helpers are written so the storage layer can later be swapped for a real
// backend (Supabase / Firebase / Auth.js) without touching component code.

export interface Comment {
  id: string
  entityType: string
  entityId: string
  authorId: string
  authorDisplayName: string
  authorUsername: string
  body: string
  createdAt: string
  parentId?: string
  /** User ids that liked this comment. */
  likes: string[]
}

export interface CreateCommentInput {
  entityType: string
  entityId: string
  authorId: string
  authorDisplayName: string
  authorUsername: string
  body: string
  parentId?: string
}

export const COMMENTS_STORAGE_KEY = "poltracker-comments"
export const MAX_COMMENT_LENGTH = 500

/** Returns every stored comment, normalizing any legacy-shaped records. */
export function getComments(): Comment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeComment).filter((c): c is Comment => c !== null)
  } catch {
    return []
  }
}

function saveComments(comments: Comment[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
}

/** Persist a single comment (insert if new, replace if it already exists). */
export function saveComment(comment: Comment): void {
  const all = getComments()
  const idx = all.findIndex((c) => c.id === comment.id)
  if (idx === -1) {
    all.push(comment)
  } else {
    all[idx] = comment
  }
  saveComments(all)
}

/** Comments for one entity, sorted newest first. */
export function getCommentsForEntity(
  entityType: string,
  entityId: string
): Comment[] {
  return getComments()
    .filter((c) => c.entityType === entityType && c.entityId === entityId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

/**
 * Validates input and persists a new comment.
 * Returns `{ error }` on validation failure.
 */
export function createComment(
  input: CreateCommentInput
): Comment | { error: string } {
  const body = input.body.trim()
  if (!body) return { error: "Comment cannot be empty." }
  if (body.length > MAX_COMMENT_LENGTH)
    return { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` }

  const comment: Comment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    authorId: input.authorId,
    authorDisplayName: input.authorDisplayName,
    authorUsername: input.authorUsername,
    body,
    createdAt: new Date().toISOString(),
    parentId: input.parentId,
    likes: [],
  }
  saveComment(comment)
  return comment
}

/** Deletes a comment only when it belongs to the current user. */
export function deleteComment(
  commentId: string,
  currentUserId: string
): boolean {
  const all = getComments()
  const idx = all.findIndex(
    (c) => c.id === commentId && c.authorId === currentUserId
  )
  if (idx === -1) return false
  // Remove the comment and any of its direct replies.
  const next = all.filter(
    (c) => c.id !== commentId && c.parentId !== commentId
  )
  saveComments(next)
  return true
}

/** Toggles a like for the current user and returns the updated comment. */
export function toggleLike(
  commentId: string,
  currentUserId: string
): Comment | null {
  const all = getComments()
  const comment = all.find((c) => c.id === commentId)
  if (!comment) return null
  if (comment.likes.includes(currentUserId)) {
    comment.likes = comment.likes.filter((id) => id !== currentUserId)
  } else {
    comment.likes = [...comment.likes, currentUserId]
  }
  saveComments(all)
  return comment
}

/** Coerces legacy records (likes:number + likedBy:string[], no authorId) into the current shape. */
function normalizeComment(raw: unknown): Comment | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== "string" || typeof r.body !== "string") return null

  let likes: string[] = []
  if (Array.isArray(r.likes)) {
    likes = r.likes.filter((x): x is string => typeof x === "string")
  } else if (Array.isArray(r.likedBy)) {
    likes = (r.likedBy as unknown[]).filter(
      (x): x is string => typeof x === "string"
    )
  }

  return {
    id: r.id,
    entityType: typeof r.entityType === "string" ? r.entityType : "",
    entityId: typeof r.entityId === "string" ? r.entityId : "",
    authorId:
      typeof r.authorId === "string"
        ? r.authorId
        : typeof r.authorUsername === "string"
        ? r.authorUsername
        : "",
    authorDisplayName:
      typeof r.authorDisplayName === "string" ? r.authorDisplayName : "Anonymous",
    authorUsername:
      typeof r.authorUsername === "string" ? r.authorUsername : "anonymous",
    body: r.body,
    createdAt:
      typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    parentId: typeof r.parentId === "string" ? r.parentId : undefined,
    likes,
  }
}
