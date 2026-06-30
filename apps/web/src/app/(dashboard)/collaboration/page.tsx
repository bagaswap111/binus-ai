"use client"

import { useState, useEffect } from "react"

export default function CollaborationPage() {
  const [tab, setTab] = useState("groups")

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Collaboration</h1>
      <div className="mb-6 flex gap-2 border-b pb-2">
        {["groups", "forums"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
          >{t}</button>
        ))}
      </div>
      {tab === "groups" && <GroupsTab />}
      {tab === "forums" && <ForumsTab />}
    </div>
  )
}

function GroupsTab() {
  const [groups, setGroups] = useState<Array<{ id: string; name: string; description: string | null; _count: { members: number; messages: number }; subject: { name: string } | null }>>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ id: string; content: string; user: { name: string }; createdAt: string }>>([])
  const [newMsg, setNewMsg] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState("")

  useEffect(() => { fetch("/api/groups").then((r) => r.ok && r.json()).then(setGroups) }, [])

  async function selectGroup(id: string) {
    setSelected(id)
    const res = await fetch(`/api/groups/${id}/messages`)
    if (res.ok) setMessages(await res.json())
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected) return
    const res = await fetch(`/api/groups/${selected}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    })
    if (res.ok) {
      setNewMsg("")
      const res2 = await fetch(`/api/groups/${selected}/messages`)
      if (res2.ok) setMessages(await res2.json())
    }
  }

  async function createGroup() {
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName }),
    })
    setShowForm(false)
    setFormName("")
    fetch("/api/groups").then((r) => r.ok && r.json()).then(setGroups)
  }

  return (
    <div className="flex gap-4">
      <aside className="w-64 shrink-0">
        <button onClick={() => setShowForm(!showForm)} className="mb-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          + New Group
        </button>
        {showForm && (
          <div className="mb-3 space-y-2 rounded border p-3">
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Group name" className="w-full rounded border px-3 py-1.5 text-sm outline-none" />
            <button onClick={createGroup} disabled={!formName} className="w-full rounded bg-zinc-800 py-1.5 text-sm text-white disabled:opacity-50">Create</button>
          </div>
        )}
        <div className="space-y-1">
          {groups.map((g) => (
            <button key={g.id} onClick={() => selectGroup(g.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${selected === g.id ? "bg-zinc-200 font-medium" : "hover:bg-zinc-100"}`}
            >
              <div className="truncate font-medium">{g.name}</div>
              <div className="text-xs text-zinc-400">{g._count.members} members &middot; {g._count.messages} messages</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto max-h-[60vh]">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{m.user.name}</span>
                    <span className="text-xs text-zinc-400">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{m.content}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-sm text-zinc-400 pt-10">No messages yet</p>}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
              <button onClick={sendMessage} disabled={!newMsg.trim()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">Send</button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center pt-20 text-zinc-400">Select a group to start chatting</div>
        )}
      </div>
    </div>
  )
}

function ForumsTab() {
  const [forums, setForums] = useState<Array<{ id: string; title: string; description: string | null; _count: { posts: number }; subject: { name: string } | null; createdBy: { name: string }; isPinned: boolean }>>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [posts, setPosts] = useState<Array<{ id: string; content: string; user: { name: string }; isFlagged: boolean; flagReason: string | null; createdAt: string }>>([])
  const [newPost, setNewPost] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState("")

  useEffect(() => { fetch("/api/forums").then((r) => r.ok && r.json()).then(setForums) }, [])

  async function selectForum(id: string) {
    setSelected(id)
    const res = await fetch(`/api/forums/${id}/posts`)
    if (res.ok) setPosts(await res.json())
  }

  async function createPost() {
    if (!newPost.trim() || !selected) return
    const res = await fetch(`/api/forums/${selected}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    })
    if (res.ok) {
      setNewPost("")
      const res2 = await fetch(`/api/forums/${selected}/posts`)
      if (res2.ok) setPosts(await res2.json())
    }
  }

  async function createForum() {
    await fetch("/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle }),
    })
    setShowForm(false)
    setFormTitle("")
    fetch("/api/forums").then((r) => r.ok && r.json()).then(setForums)
  }

  return (
    <div className="flex gap-4">
      <aside className="w-64 shrink-0">
        <button onClick={() => setShowForm(!showForm)} className="mb-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          + New Forum
        </button>
        {showForm && (
          <div className="mb-3 space-y-2 rounded border p-3">
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Forum title" className="w-full rounded border px-3 py-1.5 text-sm outline-none" />
            <button onClick={createForum} disabled={!formTitle} className="w-full rounded bg-zinc-800 py-1.5 text-sm text-white disabled:opacity-50">Create</button>
          </div>
        )}
        <div className="space-y-1">
          {forums.map((f) => (
            <button key={f.id} onClick={() => selectForum(f.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${selected === f.id ? "bg-zinc-200 font-medium" : "hover:bg-zinc-100"}`}
            >
              <div className="truncate font-medium">{f.title} {f.isPinned && "📌"}</div>
              <div className="text-xs text-zinc-400">{f._count.posts} posts &middot; {f.createdBy.name}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto max-h-[60vh]">
              {posts.map((p) => (
                <div key={p.id} className={`rounded-lg border p-3 ${p.isFlagged ? "border-red-200 bg-red-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{p.user.name}</span>
                    <span className="text-xs text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{p.content}</p>
                  {p.isFlagged && <p className="mt-1 text-xs text-red-500">Flagged: {p.flagReason}</p>}
                </div>
              ))}
              {posts.length === 0 && <p className="text-center text-sm text-zinc-400 pt-10">No posts yet</p>}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <input value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Write a post (min 20 chars)" className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
              <button onClick={createPost} disabled={!newPost.trim()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">Post</button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center pt-20 text-zinc-400">Select a forum</div>
        )}
      </div>
    </div>
  )
}
