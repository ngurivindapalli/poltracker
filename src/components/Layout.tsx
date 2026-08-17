import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CommandPalette } from "@/components/search/CommandPalette";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
