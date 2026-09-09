"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-page py-20">
      <p className="label-caps">Error</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        This page could not be loaded
      </h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        A server error occurred. Other parts of Politeia remain available.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
