"use client"

import { useState, useEffect, useCallback } from "react"
import { Comment, getCommentsForEntity, createComment } from "@/lib/comments"
import { useUser } from "@/components/auth/UserProvider"
import { useTranslation } from "@/components/i18n/I18nProvider"
import { ProfileModal } from "@/components/auth/ProfileModal"
import { LocalCommentCard } from "./LocalCommentCard"
import { CommentForm } from "./CommentForm"

interface LocalCommentSectionProps {
  entityType: string
  entityId: string
  title?: string
}

/**
 * localStorage prototype comments. Rendered as a fallback only when Supabase
 * environment variables are not configured.
 */
export function LocalCommentSection({
  entityType,
  entityId,
  title = "Community Discussion",
}: LocalCommentSectionProps) {
  const { user } = useUser()
  const { t } = useTranslation()
  const [comments, setComments] = useState<Comment[]>([])
  const [authOpen, setAuthOpen] = useState(false)

  const loadData = useCallback(() => {
    setComments(getCommentsForEntity(entityType, entityId))
  }, [entityType, entityId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const topLevel = comments.filter((c) => !c.parentId)
  const repliesFor = (parentId: string) =>
    comments
      .filter((c) => c.parentId === parentId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

  function handleCreate(body: string, parentId?: string) {
    if (!user) return { error: "Create an account to comment." }
    const result = createComment({
      entityType,
      entityId,
      authorId: user.id,
      authorDisplayName: user.displayName,
      authorUsername: user.username,
      body,
      parentId,
    })
    if ("error" in result) return result
    loadData()
    return null
  }

  function handleDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id))
  }

  function handleLiked(updated: Comment) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {comments.length} {t("Comments").toLowerCase()}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground italic border border-border rounded-lg px-3 py-2 bg-muted/30">
        Comments are stored locally in this prototype.
      </p>

      {user ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
              {user.displayName.charAt(0)}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {user.displayName}
            </span>
          </div>
          <CommentForm onSubmit={(body) => handleCreate(body)} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-foreground mb-3">
            Create a local account to join the discussion.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Account
          </button>
        </div>
      )}

      {topLevel.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground text-sm">
          No comments yet. Start the discussion.
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <LocalCommentCard
              key={comment.id}
              comment={comment}
              replies={repliesFor(comment.id)}
              onDeleted={handleDeleted}
              onLiked={handleLiked}
              onReply={(body) => handleCreate(body, comment.id)}
            />
          ))}
        </div>
      )}

      <ProfileModal
        open={authOpen}
        mode="create"
        onClose={() => setAuthOpen(false)}
      />
    </section>
  )
}
