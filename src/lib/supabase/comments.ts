"use client"

import { createClient } from "./client"
import type {
  Comment,
  CommentInput,
  CommentWithProfile,
  Profile,
} from "@/types/supabase"

export const MAX_COMMENT_LENGTH = 500

const NOT_CONFIGURED =
  "Comments require Supabase setup. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."

type ProfileSummary = Pick<Profile, "username" | "display_name" | "avatar_url">

interface CommentsResult {
  data: CommentWithProfile[]
  error: string | null
}

interface MutationResult {
  error: string | null
}

interface ToggleLikeResult {
  liked: boolean
  error: string | null
}

/**
 * Loads every comment for an entity, joins author profiles, computes like
 * counts + whether the current user liked each comment, and nests replies.
 *
 * Top-level comments are sorted newest first; replies oldest first.
 */
export async function getCommentsForEntity(
  entityType: string,
  entityId: string
): Promise<CommentsResult> {
  const supabase = createClient()
  if (!supabase) return { data: [], error: NOT_CONFIGURED }

  const { data: rows, error } = await supabase
    .from("comments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true })

  if (error) return { data: [], error: error.message }

  const comments = (rows ?? []) as Comment[]
  if (comments.length === 0) return { data: [], error: null }

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)))
  const commentIds = comments.map((c) => c.id)

  const [profilesRes, likesRes, userRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds),
    supabase.auth.getUser(),
  ])

  const profileMap = new Map<string, ProfileSummary>()
  for (const p of (profilesRes.data ?? []) as (ProfileSummary & { id: string })[]) {
    profileMap.set(p.id, {
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
    })
  }

  const currentUserId = userRes.data.user?.id ?? null
  const likeCounts = new Map<string, number>()
  const likedByUser = new Set<string>()
  for (const like of (likesRes.data ?? []) as {
    comment_id: string
    user_id: string
  }[]) {
    likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) ?? 0) + 1)
    if (currentUserId && like.user_id === currentUserId) {
      likedByUser.add(like.comment_id)
    }
  }

  const enriched = new Map<string, CommentWithProfile>()
  for (const c of comments) {
    enriched.set(c.id, {
      ...c,
      profile: profileMap.get(c.user_id) ?? null,
      like_count: likeCounts.get(c.id) ?? 0,
      liked_by_current_user: likedByUser.has(c.id),
      replies: [],
    })
  }

  const topLevel: CommentWithProfile[] = []
  for (const c of enriched.values()) {
    if (c.parent_id && enriched.has(c.parent_id)) {
      enriched.get(c.parent_id)!.replies.push(c)
    } else {
      topLevel.push(c)
    }
  }

  // Replies are already in ascending (oldest first) order from the query.
  // Top-level comments: newest first.
  topLevel.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return { data: topLevel, error: null }
}

/** Inserts a new comment authored by the current user. */
export async function createComment(input: CommentInput): Promise<MutationResult> {
  const supabase = createClient()
  if (!supabase) return { error: NOT_CONFIGURED }

  const body = input.body.trim()
  if (!body) return { error: "Comment cannot be empty." }
  if (body.length > MAX_COMMENT_LENGTH)
    return { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in to comment." }

  const { error } = await supabase.from("comments").insert({
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    user_id: user.id,
    body,
    parent_id: input.parent_id ?? null,
  })

  if (error) return { error: error.message }
  return { error: null }
}

/** Updates the body of a comment. RLS ensures only the author succeeds. */
export async function updateComment(
  commentId: string,
  body: string
): Promise<MutationResult> {
  const supabase = createClient()
  if (!supabase) return { error: NOT_CONFIGURED }

  const trimmed = body.trim()
  if (!trimmed) return { error: "Comment cannot be empty." }
  if (trimmed.length > MAX_COMMENT_LENGTH)
    return { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` }

  const { error } = await supabase
    .from("comments")
    .update({ body: trimmed })
    .eq("id", commentId)

  if (error) return { error: error.message }
  return { error: null }
}

/** Deletes a comment. RLS ensures only the author can delete it. */
export async function deleteComment(commentId: string): Promise<MutationResult> {
  const supabase = createClient()
  if (!supabase) return { error: NOT_CONFIGURED }

  const { error } = await supabase.from("comments").delete().eq("id", commentId)
  if (error) return { error: error.message }
  return { error: null }
}

/** Likes the comment if not already liked, otherwise removes the like. */
export async function toggleCommentLike(
  commentId: string
): Promise<ToggleLikeResult> {
  const supabase = createClient()
  if (!supabase) return { liked: false, error: NOT_CONFIGURED }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { liked: false, error: "You must be logged in to like comments." }

  const { data: existing, error: selectError } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (selectError) return { liked: false, error: selectError.message }

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
    if (error) return { liked: true, error: error.message }
    return { liked: false, error: null }
  }

  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: user.id })
  if (error) return { liked: false, error: error.message }
  return { liked: true, error: null }
}

/** Returns the total number of likes for a comment. */
export async function getCommentLikeCount(commentId: string): Promise<number> {
  const supabase = createClient()
  if (!supabase) return 0

  const { count, error } = await supabase
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId)

  if (error) return 0
  return count ?? 0
}

/** Returns whether the current user has liked a given comment. */
export async function hasUserLikedComment(commentId: string): Promise<boolean> {
  const supabase = createClient()
  if (!supabase) return false

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return false
  return data !== null
}
