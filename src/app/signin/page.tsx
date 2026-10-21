"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";

function SignInForm() {
  const { signInWithGoogle, isConfigured, loading, user } = useAuth();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle(callbackUrl);
    } catch {
      setError("Google sign-in could not be started.");
    }
  }

  return (
    <main className="container-page py-10">
      <PageHeader
        title="Sign in"
        subtitle="Use your Google account to join the discussion on Politeia."
      />
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6">
        {user ? (
          <p className="text-sm text-muted-foreground">You are already signed in.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Checking your session...</p>
        ) : isConfigured ? (
          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Continue with Google
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Google sign-in is not configured on this environment yet.
          </p>
        )}
        {(error || authError) && (
          <p className="mt-3 text-sm text-destructive">
            {error || "Sign-in was cancelled or could not be completed."}
          </p>
        )}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="container-page py-10">Loading...</main>}>
      <SignInForm />
    </Suspense>
  );
}
