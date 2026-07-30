"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useTranslation } from "@/components/i18n/I18nProvider"
import { AuthModal, type AuthModalMode } from "@/components/auth/AuthModal"
import type { CommentWithProfile } from "@/types/supabase"
import {
  getCommentsForEntity,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "@/lib/supabase/comments"
import { CommentCard } from "./CommentCard"
import { CommentForm } from "./CommentForm"
import { LocalCommentSection } from "./LocalCommentSection"

interface CommentSectionProps {
  entityType: string
  entityId: string
  title?: string
}

function countAll(comments: CommentWithProfile[]): number {
  return comments.reduce((sum, c) => sum + 1 + countAll(c.replies), 0)
}

export function CommentSection(props: CommentSectionProps) {
  const { isConfigured } = useAuth()

  // No Supabase env vars -> localStorage prototype fallback.
  if (!isConfigured) {
    return <LocalCommentSection {...props} />
  }
  return <SupabaseCommentSection {...props} />
}

function SupabaseCommentSection({
  entityType,
  entityId,
  title = "Community Discussion",
}: CommentSectionProps) {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthModalMode | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await getCommentsForEntity(entityType, entityId)
    setComments(data)
    setLoadError(error)
    setLoading(false)
  }, [entityType, entityId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleCreate = useCallback(
    async (body: string, parentId?: string) => {
      const { error } = await createComment({
        entity_type: entityType,
        entity_id: entityId,
        body,
        parent_id: parentId ?? null,
      })
      if (error) return { error }
      await load()
      return null
    },
    [entityType, entityId, load]
  )

  const handleReply = useCallback(
    (parentId: string, body: string) => handleCreate(body, parentId),
    [handleCreate]
  )

  const handleEdit = useCallback(
    async (id: string, body: string) => {
      const { error } = await updateComment(id, body)
      if (error) return { error }
      await load()
      return null
    },
    [load]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      const { error } = await deleteComment(id)
      if (!error) await load()
    },
    [load]
  )

  const handleToggleLike = useCallback(
    async (id: string) => {
      const { error } = await toggleCommentLike(id)
      if (!error) await load()
    },
    [load]
  )

  const total = countAll(comments)

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {total} {t("Comments").toLowerCase()}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground italic border border-border rounded-lg px-3 py-2 bg-muted/30">
        Comments are saved to the cloud.
      </p>

      {user && profile ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
              {(profile.display_name || profile.username || "M").charAt(0)}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {profile.display_name || profile.username}
            </span>
          </div>
          <CommentForm onSubmit={(body) => handleCreate(body)} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-foreground mb-3">
            Create an account or log in to join the discussion.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setAuthMode("signup")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthMode("login")}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-4 px-4 text-center text-destructive text-sm">
          {loadError}
        </div>
      )}

      {!loadError && loading ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground text-sm">
          Loading comments...
        </div>
      ) : !loadError && comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground text-sm">
          No comments yet. Start the discussion.
        </div>
      ) : (
        !loadError && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={user?.id ?? null}
                onToggleLike={handleToggleLike}
                onDelete={handleDelete}
                onReply={handleReply}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )
      )}

      <AuthModal
        open={authMode !== null}
        mode={authMode ?? "signup"}
        onClose={() => setAuthMode(null)}
        onModeChange={(m) => setAuthMode(m)}
      />
    </section>
  )
}
