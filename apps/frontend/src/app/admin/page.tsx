"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, BarChart3, Settings, ShieldAlert, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => (await api.get("/user/stats")).data // Fallback dashboard stats for preview
  });

  const modules = [
    { title: "User Management", desc: "Manage registered students, instructors, and admin accounts.", icon: Users, link: "/profile", count: "142 Users" },
    { title: "Course Editor", desc: "Create, edit, and publish Socratic roadmaps and exercise contents.", icon: BookOpen, link: "/courses", count: "8 Tracks" },
    { title: "AI Prompt Templates", desc: "Modify system instruction prompts and safety parameter configs.", icon: Settings, link: "/settings", count: "4 Active" },
    { title: "Audit & Safety Logs", desc: "Review prompt injection detections, logs, and user reports.", icon: ShieldAlert, link: "/history", count: "0 Incidents" }
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background animate-pulse p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-card border border-border/50 p-6" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Conrad Admin</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Back to User Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground mt-1">Monitor operational metrics and edit learning curriculums.</p>
        </div>

        {/* Analytics Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Sessions", value: "24", icon: BarChart3, color: "text-emerald-500" },
            { label: "Total LLM Requests", value: "1,408", icon: MessageSquare, color: "text-blue-500" },
            { label: "XP Distributed", value: stats?.xp ?? "0", icon: Users, color: "text-yellow-500" },
            { label: "Safety Alert Rate", value: "0.0%", icon: ShieldAlert, color: "text-red-500" }
          ].map((card) => (
            <div key={card.label} className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex justify-between items-start text-xs text-muted-foreground uppercase">
                <span>{card.label}</span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="mt-3 text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </section>

        {/* Modules Section */}
        <section className="grid md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <Link href={mod.link} key={mod.title} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <mod.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-between">
                  <h3 className="font-semibold">{mod.title}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{mod.count}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
