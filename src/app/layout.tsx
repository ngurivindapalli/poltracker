import "./globals.css"
import { Layout } from "@/components/Layout"
import { ThemeProvider } from "@/components/theme-provider";

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
        <ThemeProvider>
          <Layout>
            {children}
          </Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
