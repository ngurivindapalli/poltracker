import "./globals.css"
import Script from "next/script"
import { Layout } from "@/components/Layout"
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { UserProvider } from "@/components/auth/UserProvider";

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
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8171139092209357"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <UserProvider>
              <Layout>
                {children}
              </Layout>
            </UserProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
