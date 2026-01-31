import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'PolTracker Gov',
  description: 'Browse U.S. Senators and the legislation they sponsor using official U.S. Government APIs.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-zinc-900" />
                <div>
                  <Link href="/" className="text-lg font-semibold no-underline hover:underline">
                    PolTracker Gov
                  </Link>
                </div>
              </div>
              <nav className="text-sm text-zinc-700">
                <a href="/" className="no-underline hover:underline">Home</a>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

          <footer className="border-t">
            <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-600">
              Data sources: Congress.gov API (via api.congress.gov) and GovInfo. Requires an api.data.gov key.
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
