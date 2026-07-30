"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bug, Clock, Flame, MessageSquare, Terminal, Trophy } from "lucide-react";
import Link from "next/link";
import { formatDuration, formatXP } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["user", "stats"], queryFn: async () => (await api.get("/user/stats")).data });
  const { data: progress = [] } = useQuery({ queryKey: ["progress"], queryFn: async () => (await api.get("/progress")).data });
  const { data: chats = [] } = useQuery({ queryKey: ["chats"], queryFn: async () => (await api.get("/chat")).data });
  const cards = [
    ["XP Earned", formatXP(stats?.xp ?? 0), Trophy, "text-yellow-400"],
    ["Current Streak", `${stats?.streak ?? 0} days`, Flame, "text-orange-400"],
    ["Bugs Solved", stats?.bugsSolved ?? 0, Bug, "text-red-400"],
    ["Study Time", formatDuration(stats?.totalStudyTime ?? 0), Clock, "text-blue-400"],
  ] as const;

  return <div className="min-h-screen bg-background pb-16">
    <header className="glass border-b border-border/50"><div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2"><Terminal className="w-6 h-6 text-primary" /><span className="text-xl font-bold">Conrad</span></Link>
      <div className="flex items-center gap-4"><span className="text-sm text-muted-foreground hidden sm:block">Welcome back, {user?.name}</span><Link href="/tutor" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">New session</Link></div>
    </div></header>
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{cards.map(([label, value, Icon, color]) => <div key={label} className="p-4 rounded-2xl bg-card border border-border/50"><div className="flex gap-2 items-center text-xs text-muted-foreground uppercase"><Icon className={`w-4 h-4 ${color}`} />{label}</div><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50"><div className="flex justify-between items-center mb-4"><h2 className="font-semibold">Continue learning</h2><Link href="/progress" className="text-sm text-primary">View all</Link></div>
          <div className="space-y-3">{progress.length ? progress.slice(0, 5).map((item: any) => <Link href={item.course?.slug ? `/courses/${item.course.slug}` : "/courses"} key={item.id} className="block p-3 rounded-xl bg-muted/50 hover:bg-muted"><div className="flex justify-between gap-4"><div><p className="font-medium">{item.lesson?.title || item.course?.title || "Learning progress"}</p><p className="text-xs text-muted-foreground">{item.course?.category || item.status}</p></div><span className="text-sm">{item.mastery}%</span></div><div className="mt-2 h-1.5 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${item.mastery}%` }} /></div></Link>) : <p className="text-sm text-muted-foreground">No saved progress yet. <Link href="/courses" className="text-primary">Browse courses</Link>.</p>}</div>
        </section>
        <section className="p-6 rounded-2xl bg-card border border-border/50"><h2 className="font-semibold flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-accent" />Recent chats</h2><div className="space-y-2">{chats.length ? chats.slice(0, 5).map((chat: any) => <Link href="/tutor" key={chat.id} className="block p-2 rounded-lg hover:bg-muted"><p className="text-sm font-medium truncate">{chat.title}</p><p className="text-xs text-muted-foreground">{new Date(chat.updatedAt).toLocaleDateString()}</p></Link>) : <p className="text-sm text-muted-foreground">Your conversations will appear here.</p>}</div></section>
      </div>
    </main>
  </div>;
}
