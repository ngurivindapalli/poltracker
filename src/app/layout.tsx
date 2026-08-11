import "./globals.css"
import { Layout } from "@/components/Layout"
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata = {
  title: "Politeia | Government Transparency Platform",
  description: "Professional political intelligence tracking investments, relationships, and influence across government.",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <Layout>
            {children}
          </Layout>
        </AppProviders>
      </body>
    </html>
  )
}
