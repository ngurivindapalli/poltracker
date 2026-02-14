import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'PolTracker Gov',
  description: 'Browse U.S. Senators and the legislation they sponsor using official U.S. Government APIs.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary" />
                <div>
                  <Link href="/" className="text-lg font-semibold text-primary no-underline hover:text-accent transition-colors">
                    PolTracker Gov
                  </Link>
                </div>
              </div>
              <nav className="text-sm text-muted">
                <a href="/" className="no-underline hover:text-primary transition-colors">Home</a>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-12">{children}</main>

          <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted">
              Data sources: Congress.gov API (via api.congress.gov) and GovInfo. Requires an api.data.gov key.
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
