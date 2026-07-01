"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

interface Message {
  id: string
  role: string
  content: string
}

interface Session {
  id: string
  title: string
  createdAt: string
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchSessions() }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function fetchSessions() {
    const res = await fetch("/api/sessions")
    if (res.ok) setSessions(await res.json())
  }

  async function loadSession(id: string) {
    setCurrentSessionId(id)
    const res = await fetch(`/api/chat/${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    const userMsg = input
    setInput("")
    setMessages((prev) => [...prev, { id: "tmp", role: "user", content: userMsg }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, sessionId: currentSessionId }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId)
        fetchSessions()
      }
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "tmp"),
        { id: "assistant", role: "assistant", content: data.content },
      ])
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== "tmp"))
    }
    setLoading(false)
  }

  async function newChat() {
    setCurrentSessionId(null)
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* sidebar sessions */}
      <aside className="w-60 shrink-0 overflow-y-auto border-r pr-2">
        <button onClick={newChat} className="mb-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          + New Chat
        </button>
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => loadSession(s.id)}
            className={`sel-item ${currentSessionId === s.id ? "sel-item-active" : ""}`}
          >
            {s.title}
          </button>
        ))}
      </aside>

      {/* chat area */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center pt-20 text-zinc-400">
              Start a conversation
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t pt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
