import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legislation",
  description:
    "Recently updated bills from Congress.gov. Latest official actions, not Politeia interpretations.",
};

export default function BillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
