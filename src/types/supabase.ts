// Shared types for the Supabase-backed accounts + comments system.

export interface Profile {
  id: string
  username: string | null
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  entity_type: string
  entity_id: string
  user_id: string
  body: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

/** A comment enriched with author profile, like info, and nested replies. */
export interface CommentWithProfile extends Comment {
  profile: Pick<Profile, "username" | "display_name" | "avatar_url"> | null
  like_count: number
  liked_by_current_user: boolean
  replies: CommentWithProfile[]
}

export interface CommentLike {
  id: string
  comment_id: string
  user_id: string
  created_at: string
}

/** Profile fields a user can set when signing up or editing their profile. */
export interface AuthUserProfileInput {
  display_name: string
  username: string
  avatar_url?: string | null
}

/** Payload for creating a new comment. */
export interface CommentInput {
  entity_type: string
  entity_id: string
  body: string
  parent_id?: string | null
}
