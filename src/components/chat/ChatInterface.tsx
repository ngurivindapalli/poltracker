"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatChatMessage } from "@/components/chat/formatMessage";
import { CHAT_MAX_MESSAGE_CHARS } from "@/lib/chat/limits";

type Source = {
  type: string;
  title: string;
  url?: string;
  date?: string | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  unverified?: boolean;
  retryable?: boolean;
  error?: boolean;
};

const SUGGESTIONS = [
  "Who represents Massachusetts in the Senate?",
  "What bills has Elizabeth Warren sponsored recently?",
  "What do Politeia's records say about congressional stock trades?",
  "What recent news is cached for Bernie Sanders?",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages, loading]);

  const send = async (text: string, historyOverride?: Message[]) => {
    const userMessage = text.trim().slice(0, CHAT_MAX_MESSAGE_CHARS);
    if (!userMessage || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    const prior = historyOverride || messages;
    if (!historyOverride) {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    }

    try {
      const history = prior
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });
      const data = await response.json().catch(() => ({}));
      const answer =
        typeof data.answer === "string" && data.answer.trim()
          ? data.answer
          : "The research assistant could not answer that. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
          sources: Array.isArray(data.sources) ? data.sources : undefined,
          unverified: Boolean(data.unverified),
          retryable: Boolean(data.retryable) || !response.ok,
          error: Boolean(data.error) || !response.ok,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "The research assistant is temporarily unavailable. Please try again.",
          retryable: true,
          error: true,
        },
      ]);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    await send(userMessage);
  };

  const retryLast = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || loading) return;
    const history = messages.filter((m) => m !== messages[messages.length - 1]);
    setMessages(history);
    await send(lastUser.content, history.filter((m) => m.role === "user" ? true : !m.error));
  };

  return (
    <div className="flex min-h-[600px] h-[calc(100vh-300px)] flex-col">
      <Card className="mb-4 flex-1 overflow-y-auto border-border p-6">
        {messages.length === 0 && (
          <div className="px-2 py-10 text-center text-muted-foreground">
            <p className="mb-2 text-base text-foreground">Ask Politeia</p>
            <p className="mb-6 text-sm">
              Answers are grounded in Politeia&apos;s stored congressional, financial, and news records when those records exist.
            </p>
            <div className="mx-auto grid max-w-xl gap-2 text-left">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => send(question)}
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.role === "assistant"
                    ? formatChatMessage(msg.content)
                    : msg.content}
                </div>
                {msg.unverified && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This answer could not be fully verified from Politeia records.
                  </p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-2 text-[12px] font-semibold text-muted-foreground">
                      Sources
                    </div>
                    <div className="space-y-1">
                      {msg.sources.map((source, sIdx) => (
                        <div key={`${source.title}-${sIdx}`} className="text-[12px]">
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {source.title}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              {source.title}
                            </span>
                          )}
                          {source.date ? (
                            <span className="text-muted-foreground">
                              {" "}
                              ({source.date})
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.retryable && idx === messages.length - 1 && (
                  <button
                    type="button"
                    onClick={retryLast}
                    className="mt-3 text-xs font-medium text-primary hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted p-4 text-foreground">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          maxLength={CHAT_MAX_MESSAGE_CHARS}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask about members, bills, disclosures, or news"
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <Button
          onClick={() => void handleSend()}
          disabled={!input.trim() || loading}
          variant="primary"
          className="px-6"
        >
          {loading ? "Sending" : "Send"}
        </Button>
      </div>
    </div>
  );
}
