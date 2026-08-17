import ChatInterface from "@/components/chat/ChatInterface";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Politeia",
  description:
    "Ask questions about politicians, legislation, and policy. Get answers with links to the underlying sources.",
};

export default function ChatPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Ask Politeia</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ask about politicians, legislation, and policy.
      </p>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Answers link back to Politeia and public sources.
      </p>
      <div className="mt-8">
        <ChatInterface />
      </div>
    </div>
  );
}
