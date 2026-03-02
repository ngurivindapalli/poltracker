"use client"

import { useState } from "react"

export default function AIPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Ask anything about politicians, bills, or news."
    }
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input || loading) return

    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ]

    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: newMessages
        })
      })

      const data = await res.json()
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply
        }
      ])
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 900,
      margin: "60px auto",
      padding: 20
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontWeight: 700 }}>
        PolTracker AI
      </h1>

      <p style={{ color: "#6B7280", marginBottom: 30 }}>
        Ask questions about politicians, legislation, and news.
      </p>

      <div style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
        minHeight: 400,
        marginBottom: 20,
        backgroundColor: "#FAFAFA",
        overflowY: "auto",
        maxHeight: "60vh"
      }}>
        {messages.map((m, i) => (
          <div key={i}
            style={{
              marginBottom: 15,
              textAlign: m.role === "user" ? "right" : "left"
            }}
          >
            <div style={{
              display: "inline-block",
              padding: 12,
              borderRadius: 10,
              background: m.role === "user" ? "#2563eb" : "#eee",
              color: m.role === "user" ? "white" : "black",
              maxWidth: "80%"
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left", marginTop: 10 }}>
            <div style={{
              display: "inline-block",
              padding: 12,
              borderRadius: 10,
              background: "#eee",
              color: "#6B7280"
            }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: "flex",
        gap: 10
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && !loading && send()}
          placeholder="Ask about politicians or bills..."
          disabled={loading}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: "1rem",
            outline: "none"
          }}
        />

        <button
          onClick={send}
          disabled={loading || !input}
          style={{
            padding: "14px 20px",
            background: loading ? "#ccc" : "#111",
            color: "white",
            borderRadius: 10,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  )
}
