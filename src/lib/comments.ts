export interface Comment {
  id: string
  entityType: string
  entityId: string
  authorDisplayName: string
  authorUsername: string
  body: string
  createdAt: string
  parentId?: string
  likes: number
  likedBy: string[]
}

export const COMMENTS_STORAGE_KEY = "poltracker-comments"
const MAX_BODY_LENGTH = 500

export function loadComments(): Comment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Comment[]
  } catch {
    return []
  }
}

export function saveComments(comments: Comment[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
}

export function getCommentsForEntity(entityType: string, entityId: string): Comment[] {
  const all = loadComments()
  return all.filter((c) => c.entityType === entityType && c.entityId === entityId)
}

export function addComment(params: {
  entityType: string
  entityId: string
  authorDisplayName: string
  authorUsername: string
  body: string
  parentId?: string
}): Comment | { error: string } {
  const trimmed = params.body.trim()
  if (!trimmed) return { error: "Comment cannot be empty." }
  if (trimmed.length > MAX_BODY_LENGTH)
    return { error: `Comment must be ${MAX_BODY_LENGTH} characters or fewer.` }

  const all = loadComments()
  const comment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType: params.entityType,
    entityId: params.entityId,
    authorDisplayName: params.authorDisplayName,
    authorUsername: params.authorUsername,
    body: trimmed,
    createdAt: new Date().toISOString(),
    parentId: params.parentId,
    likes: 0,
    likedBy: [],
  }
  all.push(comment)
  saveComments(all)
  return comment
}

export function deleteComment(id: string, username: string): boolean {
  const all = loadComments()
  const idx = all.findIndex((c) => c.id === id && c.authorUsername === username)
  if (idx === -1) return false
  all.splice(idx, 1)
  saveComments(all)
  return true
}

export function toggleLike(id: string, username: string): Comment | null {
  const all = loadComments()
  const comment = all.find((c) => c.id === id)
  if (!comment) return null
  const alreadyLiked = comment.likedBy.includes(username)
  if (alreadyLiked) {
    comment.likedBy = comment.likedBy.filter((u) => u !== username)
    comment.likes = Math.max(0, comment.likes - 1)
  } else {
    comment.likedBy.push(username)
    comment.likes += 1
  }
  saveComments(all)
  return comment
}
