"use client"

import { useEffect, useState } from "react"
import { Star, Trophy, Flame, Award, Medal, Check } from "lucide-react"
import { safeFetchJSON } from "@/lib/security"

export default function GamificationPage() {
  const [xpData, setXpData] = useState<{ xp: number; level: number; streak: number; badges: any[] } | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [tab, setTab] = useState("overview")

  useEffect(() => {
    safeFetchJSON<{ xp: number; level: number; streak: number; badges: any[] }>("/api/gamification/xp").then((d) => d && setXpData(d))
    safeFetchJSON<{ leaderboard: any[] }>("/api/gamification/leaderboard").then((d) => d && setLeaderboard(d.leaderboard))
    safeFetchJSON<{ challenges: any[] }>("/api/gamification/challenges").then((d) => d && setChallenges(d.challenges))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Gamification</h1>

      <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl mb-1"><Star className="size-6" aria-hidden="true" /></div>
          <div className="text-2xl font-bold text-foreground">{xpData?.xp ?? 0}</div>
          <div className="text-xs text-muted-foreground">Total XP</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl mb-1"><Trophy className="size-6" aria-hidden="true" /></div>
          <div className="text-2xl font-bold text-foreground">{xpData?.level ?? 1}</div>
          <div className="text-xs text-muted-foreground">Level</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl mb-1"><Flame className="size-6" aria-hidden="true" /></div>
          <div className="text-2xl font-bold text-foreground">{xpData?.streak ?? 0} hari</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl mb-1"><Award className="size-6" aria-hidden="true" /></div>
          <div className="text-2xl font-bold text-foreground">{xpData?.badges?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground">Badges</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress ke Level {xpData ? xpData.level + 1 : 2}</span>
          <span className="text-xs text-muted-foreground">{xpData?.xp ?? 0} / {xpData ? (xpData.level + 1) * 100 : 200} XP</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${xpData ? ((xpData.xp % 100) / 100) * 100 : 0}%` }} />
        </div>
      </div>
      </div>

      <div className="tab-list" role="tablist" aria-label="Gamification">
        {([["overview", "Ringkasan"], ["badges", "Badges"], ["leaderboard", "Peringkat"], ["challenges", "Tantangan"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`tab ${tab === k ? "tab-active" : ""}`}
            role="tab"
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            id={`tab-${k}`}
          >{l}</button>
        ))}
      </div>

      {tab === "badges" && (
        <div role="tabpanel" id="panel-badges" aria-labelledby="tab-badges" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {xpData?.badges?.map((b: any) => (
            <div key={b.id} className="rounded-xl border p-4 text-center">
              <div className="text-3xl mb-2"><Award className="size-8 mx-auto" aria-hidden="true" /></div>
              <div className="text-sm font-medium text-foreground">{b.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(b.earnedAt).toLocaleDateString()}</div>
            </div>
          ))}
          {(!xpData?.badges || xpData.badges.length === 0) && (
            <p className="col-span-full text-sm text-muted-foreground">Belum ada badge. Mulai aktivitas untuk mendapatkannya!</p>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div role="tabpanel" id="panel-leaderboard" aria-labelledby="tab-leaderboard" className="rounded-xl border">
          {leaderboard.map((entry, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < leaderboard.length - 1 ? "border-b" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold w-8 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {i === 0 ? <Medal className="size-5" aria-hidden="true" /> : i === 1 ? <Medal className="size-5 text-muted-foreground" aria-hidden="true" /> : i === 2 ? <Medal className="size-5 text-amber-600" aria-hidden="true" /> : `#${entry.rank}`}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">{entry.nickname}</div>
                  <div className="text-xs text-muted-foreground">Level {entry.level}</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-foreground">{entry.xp} XP</div>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="p-4 text-sm text-muted-foreground">Belum ada data peringkat.</p>}
        </div>
      )}

      {tab === "challenges" && (
        <div role="tabpanel" id="panel-challenges" aria-labelledby="tab-challenges" className="space-y-3">
          {challenges.map((c: any) => (
            <div key={c.id} className={`rounded-xl border p-4 ${c.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">+{c.xpReward} XP</div>
                  {c.completed && <div className="text-xs text-green-600 dark:text-green-400"><Check className="size-3 inline mr-0.5" aria-hidden="true" />Selesai</div>}
                </div>
              </div>
            </div>
          ))}
          {challenges.length === 0 && <p className="text-sm text-muted-foreground">Belum ada tantangan hari ini.</p>}
        </div>
      )}
    </div>
  )
}
