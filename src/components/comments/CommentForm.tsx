"use client"

import { useState } from "react"
import { MAX_COMMENT_LENGTH } from "@/lib/comments"

type SubmitResult = { error: string } | null | void

interface CommentFormProps {
  /**
   * Persist the body. Return `{ error }` (sync or async) to keep the form open
   * and show a message. May be async; the form shows a loading state while it
   * resolves.
   */
  onSubmit: (body: string) => SubmitResult | Promise<SubmitResult>
  placeholder?: string
  submitLabel?: string
  onCancel?: () => void
  autoFocus?: boolean
  compact?: boolean
}

export function CommentForm({
  onSubmit,
  placeholder = "Share your thoughts...",
  submitLabel = "Post Comment",
  onCancel,
  autoFocus = false,
  compact = false,
}: CommentFormProps) {
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const remaining = MAX_COMMENT_LENGTH - body.length
  const trimmed = body.trim()

  async function handleSubmit() {
    if (!trimmed || submitting) return
    setError("")
    setSubmitting(true)
    try {
      const result = await onSubmit(body)
      if (result && "error" in result && result.error) {
        setError(result.error)
        return
      }
      setBody("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        disabled={submitting}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-[11px] ${
            remaining <= 0 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {body.length}/{MAX_COMMENT_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {error && <span className="text-[12px] text-destructive">{error}</span>}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!trimmed || submitting}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
