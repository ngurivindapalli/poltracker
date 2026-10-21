"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

export type AuthModalMode = "signup" | "login" | "edit";

interface AuthModalProps {
  open: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "text-[12px] font-medium text-muted-foreground block mb-1";

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { signInWithGoogle, updateProfile, profile, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSubmitting(false);
    setDisplayName(profile?.display_name ?? "");
  }, [open, mode, profile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleGoogle() {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Google sign-in could not be started.");
      setSubmitting(false);
    }
  }

  async function handleSave() {
    const name = displayName.trim();
    if (!name) return setError("Display name is required.");
    setSubmitting(true);
    const { error: updateError } = await updateProfile({ display_name: name });
    setSubmitting(false);
    if (updateError) return setError(updateError);
    onClose();
  }

  const title =
    mode === "edit" ? "Edit Profile" : mode === "login" ? "Sign in" : "Create account";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors -mr-1 -mt-1 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-[12px] text-muted-foreground mb-5">
          {mode === "edit"
            ? "Update how you appear across Politeia."
            : "Use your Google account to sign in or create a Politeia account."}
        </p>

        {mode === "edit" ? (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Display Name <span className="text-destructive">*</span>
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                autoFocus
                className={inputClass}
              />
            </div>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Please wait..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isConfigured ? (
              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <GoogleMark />
                Continue with Google
              </button>
            ) : (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                Google sign-in is not configured on this environment yet.
              </p>
            )}
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            {mode === "login" ? (
              <p className="text-[12px] text-muted-foreground text-center">
                New to Politeia?{" "}
                <button
                  onClick={() => onModeChange("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-[12px] text-muted-foreground text-center">
                Already have an account?{" "}
                <button
                  onClick={() => onModeChange("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.94 1 10.93 1 12s.43 3.06 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
