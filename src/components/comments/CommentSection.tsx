"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Comment,
  getCommentsForEntity,
  addComment,
} from "@/lib/comments"
import { useUser } from "@/components/auth/UserProvider"
import { useTranslation } from "@/components/i18n/I18nProvider"
import { CommentCard } from "./CommentCard"
import { Card } from "@/components/ui/Card"

const MAX_LENGTH = 500

interface CommentSectionProps {
  entityType: string
  entityId: string
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const { user } = useUser()
  const { t } = useTranslation()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [error, setError] = useState("")
  const [replyError, setReplyError] = useState("")

  const loadData = useCallback(() => {
    setComments(getCommentsForEntity(entityType, entityId))
  }, [entityType, entityId])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleSubmit() {
    if (!user) return
    setError("")
    const result = addComment({
      entityType,
      entityId,
      authorDisplayName: user.displayName,
      authorUsername: user.username,
      body,
    })
    if ("error" in result) {
      setError(result.error)
      return
    }
    setBody("")
    loadData()
  }

  function handleReply(parentId: string) {
    if (!user) return
    setReplyError("")
    const result = addComment({
      entityType,
      entityId,
      authorDisplayName: user.displayName,
      authorUsername: user.username,
      body: replyBody,
      parentId,
    })
    if ("error" in result) {
      setReplyError(result.error)
      return
    }
    setReplyBody("")
    setReplyingTo(null)
    loadData()
  }

  function handleDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  function handleLiked(updated: Comment) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const topLevel = comments.filter((c) => !c.parentId)
  const replies = (parentId: string) => comments.filter((c) => c.parentId === parentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("Community Discussion")}</h3>
        <span className="text-sm text-muted-foreground">{comments.length} {t("Comments").toLowerCase()}</span>
      </div>

      <p className="text-[11px] text-muted-foreground italic border border-border rounded-lg px-3 py-2 bg-muted/30">
        Comments are stored locally in this prototype. No server or account required.
      </p>

      {user ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase">
              {user.displayName.charAt(0)}
            </span>
            <span className="text-sm font-medium text-foreground">{user.displayName}</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className={`text-[11px] ${body.length >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
              {body.length}/{MAX_LENGTH}
            </span>
            <div className="flex items-center gap-2">
              {error && <span className="text-[12px] text-destructive">{error}</span>}
              <button
                onClick={handleSubmit}
                disabled={!body.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t("Save")}
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          Create a local profile to join the discussion.
        </Card>
      )}

      {topLevel.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No comments yet. Be the first to share your thoughts.
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                replies={replies(comment.id)}
                onDeleted={handleDeleted}
                onLiked={handleLiked}
                onReply={(parentId) => {
                  setReplyingTo(replyingTo === parentId ? null : parentId)
                  setReplyBody("")
                  setReplyError("")
                }}
              />
              {replyingTo === comment.id && user && (
                <div className="ml-6 mt-3 border-l-2 border-border pl-4 space-y-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value.slice(0, MAX_LENGTH))}
                    placeholder={`Reply to ${comment.authorDisplayName}...`}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                  {replyError && <p className="text-[12px] text-destructive">{replyError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyBody.trim()}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {t("Reply")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
