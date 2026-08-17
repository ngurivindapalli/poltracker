"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

/**
 * Format message text to render links as clickable
 */
function formatMessage(text: string): React.ReactNode {
  // Match URLs (especially Congress.gov links)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563EB] underline hover:text-[#1D4ED8] break-all"
        >
          {part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
    inputRef.current?.focus()
  }, [messages])

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
          message: userMessage
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
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[600px]">
      {/* Messages Area */}
      <Card className="flex-1 overflow-y-auto p-6 mb-4 border border-[#E2E8F0]">
        {messages.length === 0 && (
          <div className="text-center text-[#64748B] text-[16px] py-12">
            <p className="mb-4">Ask about politicians, legislation, and policy.</p>
            <p className="mb-4 text-sm">Try a question:</p>
            <ul className="text-left inline-block space-y-2 max-w-md">
              <li>• Which senators have disclosed trades this year?</li>
              <li>• Show bills recently updated in Congress</li>
              <li>• Who represents Massachusetts in the Senate?</li>
              <li>• What’s happening on C-SPAN?</li>
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-[#2563EB] text-white"
                    : "bg-[#F1F5F9] text-[#1E3A5F]"
                }`}
              >
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">
                  {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                    <div className="text-[12px] font-semibold text-[#64748B] mb-2">
                      Sources:
                    </div>
                    <div className="space-y-1">
                      {msg.sources.map((source, sIdx) => (
                        <div key={sIdx} className="text-[12px]">
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
                            <span className="text-[#64748B]">{source.title}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F1F5F9] text-[#1E3A5F] rounded-lg p-4">
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
      </Card>

      {/* Input Area */}
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about politicians, legislation, and policy"
          className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          variant="primary"
          className="px-6"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
