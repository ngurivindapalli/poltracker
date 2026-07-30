"use client"

import { useState } from "react"
import type { CommentWithProfile } from "@/types/supabase"
import { useTranslation } from "@/components/i18n/I18nProvider"
import { CommentForm } from "./CommentForm"

interface CommentCardProps {
  comment: CommentWithProfile
  currentUserId: string | null
  onToggleLike: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onReply?: (parentId: string, body: string) => Promise<{ error: string } | null>
  onEdit?: (id: string, body: string) => Promise<{ error: string } | null>
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

function authorName(comment: CommentWithProfile): string {
  return comment.profile?.display_name || comment.profile?.username || "Member"
}

export function CommentCard({
  comment,
  currentUserId,
  onToggleLike,
  onDelete,
  onReply,
  onEdit,
}: CommentCardProps) {
  const { t } = useTranslation()
  const [replyOpen, setReplyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwn = !!currentUserId && currentUserId === comment.user_id
  const displayName = authorName(comment)
  const edited = comment.updated_at && comment.updated_at !== comment.created_at

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleReplySubmit(body: string) {
    if (!onReply) return null
    const result = await onReply(comment.id, body)
    if (!result) setReplyOpen(false)
    return result
  }

  async function handleEditSubmit(body: string) {
    if (!onEdit) return null
    const result = await onEdit(comment.id, body)
    if (!result) setEditOpen(false)
    return result
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              displayName={displayName}
              avatarUrl={comment.profile?.avatar_url ?? null}
            />
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-foreground">
                {displayName}
              </span>
              {comment.profile?.username && (
                <span className="text-[12px] text-muted-foreground ml-1">
                  @{comment.profile.username}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {timeAgo(comment.created_at)}
            {edited ? " (edited)" : ""}
          </span>
        </div>

        {editOpen && onEdit ? (
          <div className="mb-2">
            <CommentForm
              onSubmit={handleEditSubmit}
              submitLabel="Save"
              placeholder="Edit your comment..."
              onCancel={() => setEditOpen(false)}
              autoFocus
              compact
            />
          </div>
        ) : (
          <p className="text-[14px] text-foreground leading-relaxed mb-3 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
        )}

        {!editOpen && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleLike(comment.id)}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
                comment.liked_by_current_user
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={comment.liked_by_current_user ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              {comment.like_count > 0 && <span>{comment.like_count}</span>}
              <span>{t("Like")}</span>
            </button>

            {onReply && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                disabled={!currentUserId}
                className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {t("Reply")}
              </button>
            )}

            {isOwn && (
              <div className="flex items-center gap-4 ml-auto">
                {onEdit && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-destructive/80 hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t("Delete")}
                </button>
              </div>
            )}
          </div>
        )}

        {replyOpen && onReply && currentUserId && (
          <div className="mt-3 pt-3 border-t border-border">
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder={`Reply to ${displayName}...`}
              submitLabel={t("Reply")}
              onCancel={() => setReplyOpen(false)}
              autoFocus
              compact
            />
          </div>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="ml-5 sm:ml-8 space-y-3 border-l-2 border-border pl-3 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Avatar({
  displayName,
  avatarUrl,
}: {
  displayName: string
  avatarUrl: string | null
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
      {displayName.charAt(0)}
    </span>
  )
}
