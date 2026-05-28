"use client"

import { useState } from "react"
import { Comment, deleteComment, toggleLike } from "@/lib/comments"
import { useUser } from "@/components/auth/UserProvider"
import { useTranslation } from "@/components/i18n/I18nProvider"
import { Card } from "@/components/ui/Card"

interface CommentCardProps {
  comment: Comment
  replies: Comment[]
  onDeleted: (id: string) => void
  onLiked: (updated: Comment) => void
  onReply: (parentId: string) => void
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function CommentCard({
  comment,
  replies,
  onDeleted,
  onLiked,
  onReply,
}: CommentCardProps) {
  const { user } = useUser()
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState(false)

  const isOwn = user?.username === comment.authorUsername
  const hasLiked = user ? comment.likedBy.includes(user.username) : false

  function handleDelete() {
    if (!user) return
    setDeleting(true)
    const ok = deleteComment(comment.id, user.username)
    if (ok) onDeleted(comment.id)
    setDeleting(false)
  }

  function handleLike() {
    if (!user) return
    const updated = toggleLike(comment.id, user.username)
    if (updated) onLiked(updated)
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
              {comment.authorDisplayName.charAt(0)}
            </span>
            <div>
              <span className="text-[13px] font-semibold text-foreground">
                {comment.authorDisplayName}
              </span>
              <span className="text-[12px] text-muted-foreground ml-1">
                @{comment.authorUsername}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="text-[14px] text-foreground leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
              hasLiked
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            } disabled:opacity-40`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={hasLiked ? "currentColor" : "none"}
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
            {comment.likes > 0 && <span>{comment.likes}</span>}
            <span>{t("Like")}</span>
          </button>

          <button
            onClick={() => onReply(comment.id)}
            disabled={!user}
            className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            {t("Reply")}
          </button>

          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[12px] font-medium text-destructive/70 hover:text-destructive transition-colors ml-auto disabled:opacity-40"
            >
              {t("Delete")}
            </button>
          )}
        </div>
      </Card>

      {replies.length > 0 && (
        <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replies={[]}
              onDeleted={onDeleted}
              onLiked={onLiked}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
