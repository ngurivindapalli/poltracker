import "./globals.css";
import { Inter } from "next/font/google";
import { Layout } from "@/components/Layout";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL("https://politeia.co"),
  title: {
    default: "Politeia | Political Transparency",
    template: "%s | Politeia",
  },
  description:
    "Public data on politicians, legislation, financial activity, and news.",
  openGraph: {
    title: "Politeia | Political Transparency",
    description:
      "Profiles, financial disclosures, legislation, and news from public sources.",
    url: "https://politeia.co",
    siteName: "Politeia",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Politeia | Political Transparency",
    description:
      "Public data on politicians, legislation, financial activity, and news.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <AppProviders>
          <Layout>{children}</Layout>
        </AppProviders>
      </body>
    </html>
  );
}
