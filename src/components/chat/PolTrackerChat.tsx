"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatChatMessage } from "@/components/chat/formatMessage";
import { CHAT_MAX_MESSAGE_CHARS } from "@/lib/chat/limits";

type PolTrackerChatProps = {
  bioguideId?: string;
  state?: string;
};

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

export default function PolTrackerChat({ bioguideId, state }: PolTrackerChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, messages, loading]);

  const send = async (text: string) => {
    const userMessage = text.trim().slice(0, CHAT_MAX_MESSAGE_CHARS);
    if (!userMessage || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    try {
      const history = messages
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          bioguideId,
          state,
          history,
        }),
      });
      const data = await response.json().catch(() => ({}));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            typeof data.answer === "string" && data.answer.trim()
              ? data.answer
              : "The research assistant could not answer that. Please try again.",
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:opacity-90"
        aria-label="Ask Politeia"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col rounded-lg border border-border bg-card shadow-elevated">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">
                  Ask Politeia
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Grounded in Politeia&apos;s stored records
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="py-8 text-center text-[14px] text-muted-foreground">
                  <p className="mb-2">Ask about this official&apos;s stored records:</p>
                  <ul className="inline-block space-y-1 text-left">
                    <li>Sponsored bills in Politeia&apos;s Congress.gov cache</li>
                    <li>Financial estimates and transaction reports</li>
                    <li>Cached news articles</li>
                  </ul>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-[14px]">
                      {msg.role === "assistant"
                        ? formatChatMessage(msg.content)
                        : msg.content}
                    </div>
                    {msg.unverified && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Not fully verified from Politeia records.
                      </p>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 border-t border-border pt-2">
                        <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                          Sources
                        </div>
                        {msg.sources.map((source, sIdx) => (
                          <div key={`${source.title}-${sIdx}`} className="text-[11px]">
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
                              source.title
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted p-3 text-foreground">
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

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  maxLength={CHAT_MAX_MESSAGE_CHARS}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const value = input;
                      setInput("");
                      void send(value);
                    }
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
                <Button
                  onClick={() => {
                    const value = input;
                    setInput("");
                    void send(value);
                  }}
                  disabled={!input.trim() || loading}
                  variant="primary"
                  className="px-4"
                >
                  {loading ? "Sending" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
