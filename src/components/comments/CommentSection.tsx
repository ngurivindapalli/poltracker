"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/components/i18n/I18nProvider";
import { AuthModal, type AuthModalMode } from "@/components/auth/AuthModal";
import type { PublicComment } from "@/lib/comments/service";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";

interface CommentSectionProps {
  entityType: string;
  entityId: string;
  title?: string;
}

function countAll(comments: PublicComment[]): number {
  return comments.reduce((sum, comment) => sum + 1 + countAll(comment.replies), 0);
}

export function CommentSection({
  entityType,
  entityId,
  title = "Community Discussion",
}: CommentSectionProps) {
  const { user, profile, isConfigured } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthModalMode | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setComments([]);
        setLoadError(payload.error || "Unable to load comments.");
        return;
      }
      setComments(payload.comments || []);
      setLoadError(null);
    } catch {
      setComments([]);
      setLoadError("Unable to load comments.");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const handleCreate = useCallback(
    async (body: string, parentId?: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          body,
          parentId: parentId ?? null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) return { error: payload.error || "Unable to post comment." };
      setComments(payload.comments || []);
      return null;
    },
    [entityType, entityId]
  );

  const handleReply = useCallback(
    (parentId: string, body: string) => handleCreate(body, parentId),
    [handleCreate]
  );

  const handleEdit = useCallback(
    async (id: string, body: string) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) return { error: payload.error || "Unable to update comment." };
      await load();
      return null;
    },
    [load]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) await load();
    },
    [load]
  );

  const handleToggleLike = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
      if (res.ok) await load();
    },
    [load]
  );

  const total = countAll(comments);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {total} {t("Comments").toLowerCase()}
        </span>
      </div>

      {user && profile ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
              {(profile.display_name || "M").charAt(0)}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {profile.display_name}
            </span>
          </div>
          <CommentForm onSubmit={(body) => handleCreate(body)} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-foreground mb-3">Join the discussion.</p>
          <button
            onClick={() => setAuthMode("login")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {isConfigured ? "Sign in with Google" : "Sign in"}
          </button>
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
        mode={authMode ?? "login"}
        onClose={() => setAuthMode(null)}
        onModeChange={(m) => setAuthMode(m)}
      />
    </section>
  );
}
