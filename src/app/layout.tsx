import "./globals.css"
import { Layout } from "@/components/Layout"

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
    <html lang="en">
      <body className="font-sans antialiased text-[#0F172A] bg-[#F8FAFC]">
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
}
