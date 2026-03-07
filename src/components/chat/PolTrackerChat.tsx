"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

type PolTrackerChatProps = {
  bioguideId?: string
  state?: string
}

type Message = {
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    type: "bill" | "profile" | "news"
    title: string
    url?: string
  }>
}

export default function PolTrackerChat({ bioguideId, state }: PolTrackerChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          bioguideId,
          state
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer,
        sources: data.sources
      }])
    } catch (err) {
      console.error("Chat error:", err)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#1D4ED8] transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Ask PolTracker"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Modal/Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <div className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1E3A5F]">
                  Ask PolTracker
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  Ask about bills, officials, and more
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#64748B] hover:text-[#1E3A5F] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[#64748B] text-[14px] py-8">
                  <p className="mb-2">Ask me anything about:</p>
                  <ul className="text-left inline-block space-y-1">
                    <li>• Latest bills from this official</li>
                    <li>• Legislative activity</li>
                    <li>• Official profiles</li>
                  </ul>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#F1F5F9] text-[#1E3A5F]"
                    }`}
                  >
                    <div className="text-[14px] whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                        <div className="text-[11px] font-semibold text-[#64748B] mb-1">
                          Sources:
                        </div>
                        {msg.sources.map((source, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-[#64748B]">
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2563EB] hover:underline"
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
                  <div className="bg-[#F1F5F9] text-[#1E3A5F] rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#E2E8F0]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  disabled={loading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  variant="primary"
                  className="px-4"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
