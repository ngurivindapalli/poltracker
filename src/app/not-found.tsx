import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page py-20">
      <p className="label-caps">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        This URL does not match a Politeia page. Check the address or return
        home to continue browsing public political data.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Home
        </Link>
        <Link
          href="/senators"
          className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Senators
        </Link>
        <Link
          href="/bills"
          className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Legislation
        </Link>
      </div>
    </main>
  );
}
