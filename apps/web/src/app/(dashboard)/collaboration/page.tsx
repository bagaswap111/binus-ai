"use client"

import { useState, useEffect } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"

export default function CollaborationPage() {
  const [tab, setTab] = useState("groups")

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Collaboration</h1>
      <div className="tab-list" role="tablist" aria-label="Collaboration">
        {["groups", "forums"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
          >{t}</button>
        ))}
      </div>
      {tab === "groups" && <div role="tabpanel" id="panel-groups" aria-labelledby="tab-groups"><GroupsTab /></div>}
      {tab === "forums" && <div role="tabpanel" id="panel-forums" aria-labelledby="tab-forums"><ForumsTab /></div>}
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

  useEffect(() => { safeFetchJSON<Array<{ id: string; name: string; description: string | null; _count: { members: number; messages: number }; subject: { name: string } | null }>>("/api/groups").then((d) => d && setGroups(d)) }, [])

  async function selectGroup(id: string) {
    setSelected(id)
    const res = await safeFetch(`/api/groups/${id}/messages`)
    if (res) setMessages(await res.json())
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected) return
    const res = await safeFetch(`/api/groups/${selected}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    })
    if (res) {
      setNewMsg("")
      const res2 = await safeFetch(`/api/groups/${selected}/messages`)
      if (res2) setMessages(await res2.json())
    }
  }

  async function createGroup() {
    await safeFetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName }),
    })
    setShowForm(false)
    setFormName("")
    safeFetchJSON<Array<{ id: string; name: string; description: string | null; _count: { members: number; messages: number }; subject: { name: string } | null }>>("/api/groups").then((d) => d && setGroups(d))
  }

  return (
    <div className="flex gap-4">
      <aside className="w-64 shrink-0">
        <Button onClick={() => setShowForm(!showForm)} className="mb-3 w-full">
          + New Group
        </Button>
        {showForm && (
          <div className="mb-3 space-y-2 rounded border p-3">
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Group name" className="w-full rounded border px-3 py-1.5 text-sm outline-none" />
            <Button variant="secondary" onClick={createGroup} disabled={!formName} className="w-full">Create</Button>
          </div>
        )}
        <div className="space-y-1">
          {groups.map((g) => (
            <button key={g.id} onClick={() => selectGroup(g.id)}
              className={`sel-item ${selected === g.id ? "sel-item-active" : ""}`}
            >
              <div className="truncate font-medium">{g.name}</div>
              <div className="text-xs text-muted-foreground">{g._count.members} members &middot; {g._count.messages} messages</div>
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
                    <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{m.content}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-sm text-muted-foreground pt-10">No messages yet</p>}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
              <Button onClick={sendMessage} disabled={!newMsg.trim()}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center pt-20 text-muted-foreground">Select a group to start chatting</div>
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

  useEffect(() => { safeFetchJSON<Array<{ id: string; title: string; description: string | null; _count: { posts: number }; subject: { name: string } | null; createdBy: { name: string }; isPinned: boolean }>>("/api/forums").then((d) => d && setForums(d)) }, [])

  async function selectForum(id: string) {
    setSelected(id)
    const res = await safeFetch(`/api/forums/${id}/posts`)
    if (res) setPosts(await res.json())
  }

  async function createPost() {
    if (!newPost.trim() || !selected) return
    const res = await safeFetch(`/api/forums/${selected}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    })
    if (res) {
      setNewPost("")
      const res2 = await safeFetch(`/api/forums/${selected}/posts`)
      if (res2) setPosts(await res2.json())
    }
  }

  async function createForum() {
    await safeFetch("/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle }),
    })
    setShowForm(false)
    setFormTitle("")
    safeFetchJSON<Array<{ id: string; title: string; description: string | null; _count: { posts: number }; subject: { name: string } | null; createdBy: { name: string }; isPinned: boolean }>>("/api/forums").then((d) => d && setForums(d))
  }

  return (
    <div className="flex gap-4">
      <aside className="w-64 shrink-0">
        <Button onClick={() => setShowForm(!showForm)} className="mb-3 w-full">
          + New Forum
        </Button>
        {showForm && (
          <div className="mb-3 space-y-2 rounded border p-3">
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Forum title" className="w-full rounded border px-3 py-1.5 text-sm outline-none" />
            <Button variant="secondary" onClick={createForum} disabled={!formTitle} className="w-full">Create</Button>
          </div>
        )}
        <div className="space-y-1">
          {forums.map((f) => (
            <button key={f.id} onClick={() => selectForum(f.id)}
              className={`sel-item ${selected === f.id ? "sel-item-active" : ""}`}
            >
              <div className="truncate font-medium">{f.title} {f.isPinned && "📌"}</div>
              <div className="text-xs text-muted-foreground">{f._count.posts} posts &middot; {f.createdBy.name}</div>
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
                    <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{p.content}</p>
                  {p.isFlagged && <p className="mt-1 text-xs text-red-500">Flagged: {p.flagReason}</p>}
                </div>
              ))}
              {posts.length === 0 && <p className="text-center text-sm text-muted-foreground pt-10">No posts yet</p>}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <input value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Write a post (min 20 chars)" className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
              <Button onClick={createPost} disabled={!newPost.trim()}>Post</Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center pt-20 text-muted-foreground">Select a forum</div>
        )}
      </div>
    </div>
  )
}
