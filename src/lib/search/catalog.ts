export type SearchGroup =
  | "People"
  | "States"
  | "Intelligence"
  | "Pages";

export type SearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: SearchGroup;
};

export const STATIC_SEARCH_HITS: SearchHit[] = [
  { id: "senators", title: "U.S. Senate", subtitle: "All current senators", href: "/senators", group: "Pages" },
  { id: "house", title: "U.S. House", subtitle: "Representatives", href: "/representatives", group: "Pages" },
  { id: "cabinet", title: "Cabinet", href: "/cabinet", group: "Pages" },
  { id: "mayors", title: "Mayors", href: "/us/mayors", group: "Pages" },
  { id: "candidates", title: "Candidates", href: "/candidates", group: "Pages" },
  { id: "campaigns", title: "Campaigns", href: "/campaigns", group: "Intelligence" },
  { id: "bills", title: "Legislation", href: "/bills", group: "Intelligence" },
  { id: "investments", title: "Investments", href: "/investments", group: "Intelligence" },
  { id: "cspan", title: "C-SPAN Schedule", href: "/cspan", group: "Intelligence" },
  { id: "chat", title: "Ask Politeia", subtitle: "Politicians, legislation, and policy", href: "/chat", group: "Intelligence" },
  { id: "donate", title: "Support Politeia", subtitle: "Venmo and Buy Me a Coffee", href: "/donate", group: "Pages" },
  { id: "trump-trades", title: "Trump stock trades", href: "/trump-trades", group: "Intelligence" },
];
